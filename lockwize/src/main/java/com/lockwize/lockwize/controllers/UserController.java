package com.lockwize.lockwize.controllers;

import com.lockwize.lockwize.entities.EmailVerificationToken;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.repositories.CategoryRepository;
import com.lockwize.lockwize.repositories.EmailVerificationTokenRepository;
import com.lockwize.lockwize.repositories.PasswordRepository;
import com.lockwize.lockwize.repositories.UserRepository;
import com.lockwize.lockwize.services.SupabaseEmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordRepository passwordRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final SupabaseEmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;

    public UserController(UserRepository userRepository, PasswordRepository passwordRepository,
                         CategoryRepository categoryRepository, PasswordEncoder passwordEncoder,
                         SupabaseEmailService emailService, EmailVerificationTokenRepository emailVerificationTokenRepository) {
        this.userRepository = userRepository;
        this.passwordRepository = passwordRepository;
        this.categoryRepository = categoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("createdAt", user.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        String newName = request.get("name");
        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/change-password")
    @Transactional
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.length() < 6) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Current password and new password (min 6 characters) are required");
            return ResponseEntity.badRequest().body(error);
        }

        // Verificar senha atual
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Current password is incorrect");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        // Atualizar senha
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password changed successfully");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/change-email")
    @Transactional
    public ResponseEntity<Map<String, Object>> requestEmailChange(
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        String newEmail = request.get("newEmail");
        String password = request.get("password");

        if (newEmail == null || !newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Valid email is required");
            return ResponseEntity.badRequest().body(error);
        }

        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password is required and must be correct");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        // Verificar se o novo e-mail já está em uso
        if (userRepository.existsByEmail(newEmail)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "This email is already in use");
            return ResponseEntity.badRequest().body(error);
        }

        // Gerar token de verificação
        String token = generateVerificationToken();

        // Criar token de verificação
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .email(newEmail)
                .token(token)
                .used(false)
                .build();

        emailVerificationTokenRepository.save(verificationToken);

        // Enviar e-mail de verificação
        emailService.sendEmailVerificationEmail(newEmail, user.getName(), token);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification email sent to " + newEmail);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository
                .findByTokenAndUsedFalse(token)
                .orElse(null);

        if (verificationToken == null || verificationToken.getExpiresAt().isBefore(java.time.Instant.now())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid or expired token");
            return ResponseEntity.badRequest().body(error);
        }

        if (verificationToken.getUsed()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Token already used");
            return ResponseEntity.badRequest().body(error);
        }

        // Atualizar e-mail do usuário
        User user = verificationToken.getUser();
        String oldEmail = user.getEmail();
        user.setEmail(verificationToken.getEmail());
        userRepository.save(user);

        // Marcar token como usado
        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);

        // Deletar tokens antigos do usuário
        emailVerificationTokenRepository.deleteByUserId(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email changed successfully from " + oldEmail + " to " + user.getEmail());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        UUID userId = user.getId();

        passwordRepository.findAllByUser_IdAndDeletedAtIsNull(userId)
                .forEach(password -> passwordRepository.deleteById(password.getId()));

        categoryRepository.findAllByUser_Id(userId)
                .forEach(category -> categoryRepository.delete(category));

        emailVerificationTokenRepository.deleteByUserId(userId);

        userRepository.delete(user);

        return ResponseEntity.noContent().build();
    }

    private String generateVerificationToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
