# Configuração do Supabase para Envio de E-mails

Este documento explica como configurar o Supabase para que o sistema de envio de e-mails funcione corretamente.

## Opções de Configuração

O projeto suporta duas formas de enviar e-mails:

1. **Via Supabase Edge Function** (Recomendado)
2. **Via Resend diretamente** (Alternativa)

## Opção 1: Configurar Supabase Edge Function para E-mails (Recomendado)

### Passo 1: Criar uma Edge Function no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá até **Edge Functions** no menu lateral
3. Clique em **Create a new function**
4. Nome da função: `send-email`
5. Use o seguinte código para a função:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar e-mail via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lockwize <noreply@seu-dominio.com>', // Substitua pelo seu domínio
        to: to,
        subject: subject,
        html: html,
        text: text || '',
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await resendResponse.json();
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
```

### Passo 2: Configurar Resend

1. Crie uma conta no Resend: https://resend.com
2. Crie uma API Key no Resend
3. No Supabase, vá até **Edge Functions** > **Secrets**
4. Adicione uma variável de ambiente:
   - Nome: `RESEND_API_KEY`
   - Valor: Sua API Key do Resend

### Passo 3: Obter Credenciais do Supabase

1. No painel do Supabase, vá até **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: (chave secreta para uso no backend)

### Passo 4: Configurar Variáveis de Ambiente no Backend

No arquivo `lockwize/src/main/resources/application.yml`, configure ou adicione as seguintes variáveis de ambiente:

```yaml
supabase:
  url: https://xxxxx.supabase.co  # Substitua pelo seu Project URL
  service-role-key: sua_service_role_key_aqui  # Substitua pela sua Service Role Key
```

**OU** configure via variáveis de ambiente (recomendado para produção):

```bash
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## Opção 2: Usar Resend Diretamente (Alternativa)

Se você preferir não usar Edge Functions, pode configurar o Resend diretamente:

### Passo 1: Criar conta no Resend

1. Acesse: https://resend.com
2. Crie uma conta (há um plano gratuito)
3. Gere uma API Key

### Passo 2: Configurar no Backend

Configure a variável de ambiente no `application.yml` ou via variáveis de ambiente:

```yaml
supabase:
  email:
    api-key: sua_resend_api_key_aqui
```

Ou via variável de ambiente:

```bash
export RESEND_API_KEY=sua_resend_api_key_aqui
```

## Configuração do Domínio para E-mails (Opcional mas Recomendado)

Para enviar e-mails de um domínio personalizado:

1. No Resend, vá até **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Após verificação, atualize o campo `from` nas funções de e-mail para usar seu domínio

## Testando a Configuração

Após configurar, você pode testar:

1. **Registrar uma nova conta**: Deve enviar e-mail de boas-vindas
2. **Solicitar mudança de e-mail**: Deve enviar e-mail de verificação
3. **Aguardar 6 meses ou ajustar código**: Senhas antigas devem gerar e-mails de notificação

## Notas Importantes

⚠️ **Segurança:**
- Nunca commite suas API Keys no repositório
- Use variáveis de ambiente para produção
- A Service Role Key do Supabase tem acesso total - mantenha-a segura

📧 **Limites do Plano Gratuito do Resend:**
- 3.000 e-mails/mês no plano gratuito
- 100 e-mails/dia no plano gratuito

🔧 **Troubleshooting:**
- Verifique os logs do backend para erros de envio
- Verifique o dashboard do Resend para status dos e-mails
- Certifique-se de que as variáveis de ambiente estão configuradas corretamente

## URLs das E-mails

Os e-mails enviados contêm links que apontam para `http://localhost:3000`. Em produção, você precisará:

1. Atualizar os templates de e-mail em `SupabaseEmailService.java`
2. Substituir `http://localhost:3000` pela URL do seu domínio
3. Configurar o frontend para lidar com verificação de e-mail (rota `/verify-email?token=...`)
