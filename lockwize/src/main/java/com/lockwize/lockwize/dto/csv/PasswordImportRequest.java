package com.lockwize.lockwize.dto.csv;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PasswordImportRequest {
    @NotNull(message = "O arquivo CSV é obrigatório.")
    private MultipartFile file;

    private boolean overwriteExisting = false;

    private String categoryMapping; // JSON para mapear categorias (futuro)
}
