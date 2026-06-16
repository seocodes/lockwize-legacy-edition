package com.lockwize.lockwize.dto.password;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant; // tempo
import java.util.UUID;

@Data
@AllArgsConstructor
public class PasswordResponse {
    private UUID id;
    private String name;
    private String website;
    private String username;
    private String passwordEncrypted;
    private UUID categoryId;
    private Instant lastUpdated; // tempo exato
    private Instant createdAt; // tempo exato
}
