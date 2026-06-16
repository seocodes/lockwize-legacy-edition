package com.lockwize.lockwize.dto.password;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class PasswordRequest {
    @NotBlank
    private String name;
    private String website;
    @NotBlank
    private String username;
    @NotBlank
    private String passwordEncrypted;
    private UUID categoryId;
}
