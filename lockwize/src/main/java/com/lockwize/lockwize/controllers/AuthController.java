package com.lockwize.lockwize.controllers;

import com.lockwize.lockwize.dto.auth.AuthResponse;
import com.lockwize.lockwize.dto.auth.LoginRequest;
import com.lockwize.lockwize.dto.auth.RegisterRequest;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.services.JwtService;
import com.lockwize.lockwize.services.SupabaseEmailService;
import com.lockwize.lockwize.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SupabaseEmailService emailService;

    public AuthController(UserService userService, JwtService jwtService,
                         PasswordEncoder passwordEncoder, SupabaseEmailService emailService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request.getName(), request.getEmail(), request.getPassword());
            String token = jwtService.generateToken(user.getEmail());

            // Enviar e-mail de boas-vindas
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getName());
            } catch (Exception e) {
                // Log do erro mas não falha o registro
                System.err.println("Erro ao enviar e-mail de boas-vindas: " + e.getMessage());
            }

            return ResponseEntity.ok(new AuthResponse(token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.findByEmail(request.getEmail());
        if (user != null && passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            String token = jwtService.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtService.extractEmail(token);
            if (jwtService.validateToken(token, email)) {
                String newToken = jwtService.generateToken(email);
                return ResponseEntity.ok(new AuthResponse(newToken));
            }
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT é stateless, então logout é apenas do lado do cliente
        return ResponseEntity.ok().build();
    }
}
