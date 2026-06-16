package com.lockwize.lockwize.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data // getters and setters
public class LoginRequest {
    @Email // ja faz a validacao se é um email valido (ex de invalido: aasodj@@gmasi)
    @NotBlank // nao pode ser nulo
    private String email;
    @NotBlank
    private String password;
}
