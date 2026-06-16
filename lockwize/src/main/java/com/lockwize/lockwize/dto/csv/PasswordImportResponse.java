package com.lockwize.lockwize.dto.csv;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PasswordImportResponse {
    private int totalProcessed;
    private int successCount;
    private int errorCount;
    private List<String> errors;
    private List<String> warnings;
    private String message;
}