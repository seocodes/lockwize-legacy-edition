package com.lockwize.lockwize.dto.csv;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PasswordExportResponse {
    @NotBlank
    private String downloadUrl;
    @NotBlank
    private String filename;
    private LocalDateTime exportedAt;
}
