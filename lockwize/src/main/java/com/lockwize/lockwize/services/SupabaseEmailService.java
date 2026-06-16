package com.lockwize.lockwize.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
public class SupabaseEmailService {

    private static final Logger logger = LoggerFactory.getLogger(SupabaseEmailService.class);

    private final WebClient webClient;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.anon-key:}")
    private String supabaseAnonKey;

    @Value("${supabase.service-role-key:}")
    private String supabaseServiceRoleKey;

    @Value("${supabase.email.api-key:}")
    private String emailApiKey; // Para usar com Resend via Supabase Edge Function

    @Value("${app.public-url:http://localhost:3000}")
    private String publicUrl;

    @Value("${app.email.from:Lockwize <no-reply@example.com>}")
    private String emailFrom;

    public SupabaseEmailService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Envia um e-mail de notificação quando uma senha não é atualizada há 6 meses
     */
    public void sendPasswordExpirationEmail(String toEmail, String userName, String passwordName) {
        String subject = "Aviso: Senha precisa ser atualizada - Lockwize";
        String htmlBody = buildPasswordExpirationEmailHtml(userName, passwordName);
        String textBody = buildPasswordExpirationEmailText(userName, passwordName);

        sendEmail(toEmail, subject, htmlBody, textBody);
    }

    /**
     * Envia um e-mail de verificação quando o e-mail é alterado
     */
    public void sendEmailVerificationEmail(String toEmail, String userName, String verificationToken) {
        String subject = "Verifique seu novo e-mail - Lockwize";
        String htmlBody = buildEmailVerificationHtml(userName, verificationToken);
        String textBody = buildEmailVerificationText(userName, verificationToken);

        sendEmail(toEmail, subject, htmlBody, textBody);
    }

    /**
     * Envia um e-mail de boas-vindas quando o usuário se registra
     */
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Bem-vindo ao Lockwize!";
        String htmlBody = buildWelcomeEmailHtml(userName);
        String textBody = buildWelcomeEmailText(userName);

        sendEmail(toEmail, subject, htmlBody, textBody);
    }

    /**
     * Método principal para envio de e-mails via Supabase Edge Function ou Resend
     */
    private void sendEmail(String toEmail, String subject, String htmlBody, String textBody) {
        try {
            // Opção 1: Usar Supabase Edge Function para enviar e-mail
            if (supabaseUrl != null && !supabaseUrl.isEmpty() &&
                supabaseServiceRoleKey != null && !supabaseServiceRoleKey.isEmpty()) {
                sendEmailViaSupabaseEdgeFunction(toEmail, subject, htmlBody, textBody);
            }
            // Opção 2: Usar Resend diretamente via HTTP (requer API key do Resend)
            else if (emailApiKey != null && !emailApiKey.isEmpty()) {
                sendEmailViaResend(toEmail, subject, htmlBody, textBody);
            }
            else {
                logger.warn("Configuração de e-mail não encontrada. E-mail não foi enviado para: {}", toEmail);
                logger.info("Email que seria enviado - Para: {}, Assunto: {}", toEmail, subject);
            }
        } catch (Exception e) {
            logger.error("Erro ao enviar e-mail para {}: {}", toEmail, e.getMessage(), e);
        }
    }

    /**
     * Envia e-mail via Supabase Edge Function
     * Você precisa criar uma Edge Function no Supabase para isso
     */
    private void sendEmailViaSupabaseEdgeFunction(String toEmail, String subject, String htmlBody, String textBody) {
        String edgeFunctionUrl = supabaseUrl + "/functions/v1/dynamic-processor";

        Map<String, Object> payload = new HashMap<>();
        payload.put("to", toEmail);
        payload.put("subject", subject);
        payload.put("html", htmlBody);
        payload.put("text", textBody);

        webClient.post()
                .uri(edgeFunctionUrl)
                .header("Authorization", "Bearer " + supabaseServiceRoleKey)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(response -> logger.info("E-mail enviado com sucesso para {}", toEmail))
                .doOnError(error -> logger.error("Erro ao enviar e-mail via Edge Function: {}", error.getMessage()))
                .onErrorResume(error -> {
                    logger.error("Falha ao enviar e-mail via Supabase Edge Function, tentando método alternativo...");
                    sendEmailViaResend(toEmail, subject, htmlBody, textBody);
                    return Mono.empty();
                })
                .subscribe();
    }

    /**
     * Envia e-mail via Resend API diretamente
     */
    private void sendEmailViaResend(String toEmail, String subject, String htmlBody, String textBody) {
        String resendApiUrl = "https://api.resend.com/emails";

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", emailFrom);
        payload.put("to", toEmail);
        payload.put("subject", subject);
        payload.put("html", htmlBody);
        payload.put("text", textBody);

        webClient.post()
                .uri(resendApiUrl)
                .header("Authorization", "Bearer " + emailApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(response -> logger.info("E-mail enviado com sucesso via Resend para {}", toEmail))
                .doOnError(error -> logger.error("Erro ao enviar e-mail via Resend: {}", error.getMessage()))
                .subscribe();
    }

    // Métodos para construir templates de e-mail
    private String buildPasswordExpirationEmailHtml(String userName, String passwordName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Lockwize</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, %s!</h2>
                        <p>Este é um aviso automático do Lockwize.</p>
                        <p>A senha armazenada para <strong>%s</strong> não foi atualizada há mais de 6 meses.</p>
                        <p>Para manter sua segurança, recomendamos que você atualize essa senha o quanto antes.</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Acessar Lockwize</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Este é um e-mail automático, por favor não responda.</p>
                        <p>&copy; 2025 Lockwize. Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, passwordName, publicUrl);
    }

    private String buildPasswordExpirationEmailText(String userName, String passwordName) {
        return """
            Olá, %s!

            Este é um aviso automático do Lockwize.

            A senha armazenada para %s não foi atualizada há mais de 6 meses.

            Para manter sua segurança, recomendamos que você atualize essa senha o quanto antes.

            Acesse: %s

            ---
            Este é um e-mail automático, por favor não responda.
            © 2025 Lockwize. Todos os direitos reservados.
            """.formatted(userName, passwordName, publicUrl);
    }

    private String buildEmailVerificationHtml(String userName, String verificationToken) {
        String verificationUrl = publicUrl + "/verify-email?token=" + verificationToken;
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Lockwize</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, %s!</h2>
                        <p>Você solicitou alterar seu e-mail. Para confirmar a alteração, clique no botão abaixo:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Verificar E-mail</a>
                        </p>
                        <p>Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
                        <p style="word-break: break-all; font-size: 12px;">%s</p>
                        <p><strong>Este link expira em 24 horas.</strong></p>
                    </div>
                    <div class="footer">
                        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
                        <p>&copy; 2025 Lockwize. Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, verificationUrl, verificationUrl);
    }

    private String buildEmailVerificationText(String userName, String verificationToken) {
        String verificationUrl = publicUrl + "/verify-email?token=" + verificationToken;
        return """
            Olá, %s!

            Você solicitou alterar seu e-mail. Para confirmar a alteração, acesse o link abaixo:

            %s

            Este link expira em 24 horas.

            Se você não solicitou esta alteração, ignore este e-mail.

            ---
            © 2025 Lockwize. Todos os direitos reservados.
            """.formatted(userName, verificationUrl);
    }

    private String buildWelcomeEmailHtml(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Bem-vindo ao Lockwize!</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, %s!</h2>
                        <p>Bem-vindo ao Lockwize, seu gerenciador de senhas seguro!</p>
                        <p>Estamos felizes em tê-lo conosco. Agora você pode:</p>
                        <ul>
                            <li>Armazenar suas senhas de forma segura</li>
                            <li>Gerar senhas fortes</li>
                            <li>Organizar suas senhas por categorias</li>
                            <li>Importar e exportar suas senhas</li>
                        </ul>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Começar a usar</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 Lockwize. Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, publicUrl);
    }

    private String buildWelcomeEmailText(String userName) {
        return """
            Olá, %s!

            Bem-vindo ao Lockwize, seu gerenciador de senhas seguro!

            Estamos felizes em tê-lo conosco. Agora você pode armazenar suas senhas de forma segura.

            Acesse: %s

            ---
            © 2025 Lockwize. Todos os direitos reservados.
            """.formatted(userName, publicUrl);
    }
}
