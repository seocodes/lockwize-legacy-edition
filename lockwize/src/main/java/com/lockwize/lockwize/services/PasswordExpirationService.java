package com.lockwize.lockwize.services;

import com.lockwize.lockwize.entities.PasswordItem;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.repositories.PasswordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PasswordExpirationService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordExpirationService.class);

    private final PasswordRepository passwordRepository;
    private final SupabaseEmailService emailService;

    // Armazenar último envio de e-mail por usuário/senha para evitar spam
    private final Map<String, Instant> lastEmailSent = new HashMap<>();

    public PasswordExpirationService(PasswordRepository passwordRepository, SupabaseEmailService emailService) {
        this.passwordRepository = passwordRepository;
        this.emailService = emailService;
    }

    /**
     * Executa diariamente às 9:00 AM para verificar senhas antigas
     */
    @Scheduled(cron = "0 0 9 * * ?") // Todos os dias às 9:00 AM
    @Transactional(readOnly = true)
    public void checkExpiredPasswords() {
        logger.info("Iniciando verificação de senhas antigas...");

        Instant sixMonthsAgo = Instant.now().minus(6, ChronoUnit.MONTHS);

        // Buscar todas as senhas que não foram atualizadas há mais de 6 meses
        List<PasswordItem> expiredPasswords = passwordRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null) // Não deletadas
                .filter(p -> p.getLastUpdated() != null && p.getLastUpdated().isBefore(sixMonthsAgo))
                .toList();

        logger.info("Encontradas {} senhas antigas para notificar", expiredPasswords.size());

        // Agrupar por usuário para enviar um e-mail consolidado
        Map<User, List<PasswordItem>> passwordsByUser = new HashMap<>();
        for (PasswordItem password : expiredPasswords) {
            passwordsByUser.computeIfAbsent(password.getUser(), k -> new java.util.ArrayList<>()).add(password);
        }

        // Enviar e-mail para cada usuário
        for (Map.Entry<User, List<PasswordItem>> entry : passwordsByUser.entrySet()) {
            User user = entry.getKey();
            List<PasswordItem> userPasswords = entry.getValue();

            // Enviar e-mail para cada senha (ou um e-mail consolidado)
            for (PasswordItem password : userPasswords) {
                String emailKey = user.getId().toString() + "_" + password.getId().toString();

                // Verificar se já enviamos e-mail nas últimas 7 dias para evitar spam
                Instant lastSent = lastEmailSent.get(emailKey);
                if (lastSent != null && ChronoUnit.DAYS.between(lastSent, Instant.now()) < 7) {
                    logger.debug("E-mail já enviado recentemente para usuário {} e senha {}. Pulando...",
                            user.getEmail(), password.getName());
                    continue;
                }

                try {
                    // Enviar e-mail de notificação
                    emailService.sendPasswordExpirationEmail(
                            user.getEmail(),
                            user.getName(),
                            password.getName()
                    );

                    // Atualizar último envio
                    lastEmailSent.put(emailKey, Instant.now());

                    logger.info("E-mail de expiração enviado para {} sobre senha: {}",
                            user.getEmail(), password.getName());
                } catch (Exception e) {
                    logger.error("Erro ao enviar e-mail de expiração para {}: {}",
                            user.getEmail(), e.getMessage(), e);
                }
            }
        }

        logger.info("Verificação de senhas antigas concluída.");
    }

    /**
     * Método para verificação manual (pode ser chamado via endpoint)
     */
    public void checkExpiredPasswordsManually() {
        checkExpiredPasswords();
    }
}
