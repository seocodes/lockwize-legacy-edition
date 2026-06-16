package com.lockwize.lockwize.services;

import com.lockwize.lockwize.dto.csv.PasswordCsvRow;
import com.lockwize.lockwize.dto.csv.PasswordExportResponse;
import com.lockwize.lockwize.dto.csv.PasswordImportResponse;
import com.lockwize.lockwize.entities.Category;
import com.lockwize.lockwize.entities.PasswordItem;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.repositories.CategoryRepository;
import com.lockwize.lockwize.repositories.PasswordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordCsvService {

    private final PasswordRepository passwordRepository;
    private final CategoryRepository categoryRepository;

    private static final String CSV_HEADER = "name,website,username,password,category_name,notes,created_at,last_updated";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/lockwize-exports/";


    @Transactional(readOnly = true)
    public PasswordExportResponse exportPasswords(User user, List<PasswordItem> passwords) {
        try {
            log.info("Iniciando export de senhas para usuário: {}", user.getEmail());
            createTempDirectory();

            // gerar conteúdo CSV
            String csvContent = generateCsvContent(passwords);

            // salvar arquivo temporário
            String filename = String.format("passwords_export_%s_%d.csv",
                user.getEmail().replace("@", "_"), System.currentTimeMillis());
            Path filePath = Paths.get(TEMP_DIR + filename);
            Files.write(filePath, csvContent.getBytes("UTF-8"));

            // gerar URL de download (simulada - em prod seria uma URL real)
            String downloadUrl = "/api/passwords/download/" + filename;

            log.info("Export concluído: {} senhas exportadas para {}", passwords.size(), filename);

            return new PasswordExportResponse(
                downloadUrl,
                filename,
                LocalDateTime.now()
            );

        } catch (Exception e) {
            log.error("Erro ao exportar senhas para usuário {}: {}", user.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Erro ao exportar senhas: " + e.getMessage(), e);
        }
    }

    /**
     * Importa senhas de um arquivo CSV
     */
    @Transactional
    public PasswordImportResponse importPasswords(MultipartFile file, User user, boolean overwriteExisting) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        try {
            log.info("Iniciando import de senhas para usuário: {}", user.getEmail());

            // Validar arquivo
            validateFile(file);

            // Parsear CSV
            List<PasswordCsvRow> csvRows = parseCsvFile(file);

            // Processar cada linha
            for (int i = 0; i < csvRows.size(); i++) {
                PasswordCsvRow row = csvRows.get(i);
                int lineNumber = i + 2; // +2 porque linha 1 é header

                try {
                    // Validar linha
                    validateCsvRow(row, lineNumber);

                    // Processar senha
                    processPasswordRow(row, user, overwriteExisting);
                    successCount++;

                } catch (Exception e) {
                    errorCount++;
                    String error = String.format("Linha %d: %s", lineNumber, e.getMessage());
                    errors.add(error);
                    log.warn("Erro na linha {}: {}", lineNumber, e.getMessage());
                }
            }

            String message = String.format("Import concluído: %d sucessos, %d erros", successCount, errorCount);
            log.info("{} para usuário {}", message, user.getEmail());

            return new PasswordImportResponse(
                csvRows.size(),
                successCount,
                errorCount,
                errors,
                warnings,
                message
            );

        } catch (Exception e) {
            log.error("Erro ao importar senhas para usuário {}: {}", user.getEmail(), e.getMessage(), e);
            errors.add("Erro geral: " + e.getMessage());
            return new PasswordImportResponse(0, 0, 1, errors, warnings, "Erro ao processar arquivo");
        }
    }

    /**
     * Gera conteúdo CSV das senhas
     */
    private String generateCsvContent(List<PasswordItem> passwords) {
        StringBuilder csv = new StringBuilder();
        csv.append(CSV_HEADER).append("\n");

        for (PasswordItem password : passwords) {
            csv.append(escapeCsvField(password.getName())).append(",");
            csv.append(escapeCsvField(password.getWebsite())).append(",");
            csv.append(escapeCsvField(password.getUsername())).append(",");
            csv.append(escapeCsvField(password.getPasswordEncrypted())).append(",");
            csv.append(escapeCsvField(password.getCategory() != null ? password.getCategory().getName() : "")).append(",");
            csv.append(escapeCsvField("")).append(","); // notes - campo futuro
            csv.append(escapeCsvField(formatDateTime(password.getCreatedAt()))).append(",");
            csv.append(escapeCsvField(formatDateTime(password.getLastUpdated()))).append("\n");
        }

        return csv.toString();
    }

    /**
     * Parseia arquivo CSV
     */
    private List<PasswordCsvRow> parseCsvFile(MultipartFile file) throws IOException {
        List<PasswordCsvRow> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"))) {
            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue; // Pular header
                }

                if (line.trim().isEmpty()) {
                    continue; // Pular linhas vazias
                }

                PasswordCsvRow row = parseCsvLine(line);
                if (row != null) {
                    rows.add(row);
                }
            }
        }

        return rows;
    }


    private PasswordCsvRow parseCsvLine(String line) {
        String[] fields = parseCsvLine(line, 8); // 8 campos esperados

        if (fields.length < 4) {
            return null; // Linha inválida
        }

        PasswordCsvRow row = new PasswordCsvRow();
        row.setName(fields[0]);
        row.setWebsite(fields[1]);
        row.setUsername(fields[2]);
        row.setPassword(fields[3]);
        row.setCategoryName(fields.length > 4 ? fields[4] : "");
        row.setNotes(fields.length > 5 ? fields[5] : "");
        row.setCreatedAt(fields.length > 6 ? fields[6] : "");
        row.setLastUpdated(fields.length > 7 ? fields[7] : "");

        return row;
    }


    private String[] parseCsvLine(String line, int expectedFields) {
        List<String> fields = new ArrayList<>();
        StringBuilder currentField = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(currentField.toString().trim());
                currentField = new StringBuilder();
            } else {
                currentField.append(c);
            }
        }

        fields.add(currentField.toString().trim());

        // Garantir que temos o número correto de campos
        while (fields.size() < expectedFields) {
            fields.add("");
        }

        return fields.toArray(new String[0]);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB
            throw new IllegalArgumentException("Arquivo muito grande. Máximo 10MB");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Arquivo deve ser um CSV válido");
        }
    }

    private void validateCsvRow(PasswordCsvRow row, int lineNumber) {
        if (row.getName() == null || row.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Campo 'name' é obrigatório");
        }

        if (row.getUsername() == null || row.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Campo 'username' é obrigatório");
        }

        if (row.getPassword() == null || row.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Campo 'password' é obrigatório");
        }

        // Validar formato de data se fornecida
        if (!row.getCreatedAt().isEmpty()) {
            try {
                LocalDateTime.parse(row.getCreatedAt(), DATE_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Formato de data inválido em 'created_at'. Use: yyyy-MM-ddTHH:mm:ss");
            }
        }

        if (!row.getLastUpdated().isEmpty()) {
            try {
                LocalDateTime.parse(row.getLastUpdated(), DATE_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Formato de data inválido em 'last_updated'. Use: yyyy-MM-ddTHH:mm:ss");
            }
        }
    }


    private void processPasswordRow(PasswordCsvRow row, User user, boolean overwriteExisting) {
        // Verificar se já existe senha com mesmo nome e username
        Optional<PasswordItem> existingPassword = passwordRepository
            .findByUser_IdAndNameAndUsername(user.getId(), row.getName(), row.getUsername());

        if (existingPassword.isPresent() && !overwriteExisting) {
            throw new IllegalArgumentException("Senha já existe. Use 'overwriteExisting=true' para sobrescrever");
        }

        PasswordItem passwordItem;
        if (existingPassword.isPresent()) {
            passwordItem = existingPassword.get();
        } else {
            passwordItem = new PasswordItem();
            passwordItem.setUser(user);
        }

        // Atualizar dados
        passwordItem.setName(row.getName());
        passwordItem.setWebsite(row.getWebsite());
        passwordItem.setUsername(row.getUsername());
        passwordItem.setPasswordEncrypted(row.getPassword());

        // Processar categoria
        if (row.getCategoryName() != null && !row.getCategoryName().trim().isEmpty()) {
            Category category = findOrCreateCategory(row.getCategoryName(), user);
            passwordItem.setCategory(category);
        }

        // Processar datas
        if (!row.getCreatedAt().isEmpty()) {
            try {
                passwordItem.setCreatedAt(LocalDateTime.parse(row.getCreatedAt(), DATE_FORMATTER).atZone(java.time.ZoneId.systemDefault()).toInstant());
            } catch (Exception e) {
                // Usar data atual se parsing falhar
                passwordItem.setCreatedAt(Instant.now());
            }
        }

        if (!row.getLastUpdated().isEmpty()) {
            try {
                passwordItem.setLastUpdated(LocalDateTime.parse(row.getLastUpdated(), DATE_FORMATTER).atZone(java.time.ZoneId.systemDefault()).toInstant());
            } catch (Exception e) {
                // Usar data atual se parsing falhar
                passwordItem.setLastUpdated(Instant.now());
            }
        }

        passwordRepository.save(passwordItem);
    }

    /**
     * Encontra ou cria categoria
     */
    private Category findOrCreateCategory(String categoryName, User user) {
        return categoryRepository.findByUser_IdAndName(user.getId(), categoryName)
            .orElseGet(() -> {
                Category newCategory = new Category();
                newCategory.setName(categoryName);
                newCategory.setUser(user);
                return categoryRepository.save(newCategory);
            });
    }

    /**
     * Escapa campo CSV
     */
    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }

        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }

        return field;
    }

    /**
     * Formata data para CSV
     */
    private String formatDateTime(Instant instant) {
        if (instant == null) {
            return "";
        }
        return instant.atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime()
            .format(DATE_FORMATTER);
    }

    /**
     * Cria diretório temporário
     */
    private void createTempDirectory() throws IOException {
        Path tempDir = Paths.get(TEMP_DIR);
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }
    }
}