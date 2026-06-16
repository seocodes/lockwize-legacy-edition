package com.lockwize.lockwize.controllers;

import com.lockwize.lockwize.dto.csv.PasswordExportResponse;
import com.lockwize.lockwize.dto.csv.PasswordImportResponse;
import com.lockwize.lockwize.services.PasswordCsvService;
import com.lockwize.lockwize.dto.password.PasswordRequest;
import com.lockwize.lockwize.dto.password.PasswordResponse;
import com.lockwize.lockwize.entities.Category;
import com.lockwize.lockwize.entities.PasswordItem;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.repositories.CategoryRepository;
import com.lockwize.lockwize.repositories.PasswordRepository;
import com.lockwize.lockwize.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@RestController
@RequestMapping("/api/passwords")
public class PasswordController {

    private final PasswordRepository passwordRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordCsvService passwordCsvService;
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/lockwize-exports/";


    public PasswordController(PasswordRepository passwordRepository, UserRepository userRepository, CategoryRepository categoryRepository, PasswordCsvService passwordCsvService) {
        this.passwordRepository = passwordRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.passwordCsvService = passwordCsvService;
    }

    @GetMapping
    public List<PasswordResponse> list(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return passwordRepository.findAllByUser_IdAndDeletedAtIsNull(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PasswordResponse> get(@PathVariable UUID id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Optional<PasswordItem> item = passwordRepository.findById(id)
                .filter(p -> p.getUser().getId().equals(user.getId()) && p.getDeletedAt() == null);
        return item.map(p -> ResponseEntity.ok(toResponse(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PasswordResponse> create(@Valid @RequestBody PasswordRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        PasswordItem item = new PasswordItem();
        item.setName(request.getName());
        item.setWebsite(request.getWebsite());
        item.setUsername(request.getUsername());
        item.setPasswordEncrypted(request.getPasswordEncrypted());
        item.setUser(user);
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId()).orElse(null);
            if (category != null && category.getUser().getId().equals(user.getId())) {
                item.setCategory(category);
            }
        }
        PasswordItem saved = passwordRepository.save(item);
        return ResponseEntity.created(URI.create("/api/passwords/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PasswordResponse> update(@PathVariable UUID id, @Valid @RequestBody PasswordRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return passwordRepository.findById(id)
                .filter(existing -> existing.getUser().getId().equals(user.getId()) && existing.getDeletedAt() == null)
                .map(existing -> {
                    existing.setName(request.getName());
                    existing.setWebsite(request.getWebsite());
                    existing.setUsername(request.getUsername());
                    existing.setPasswordEncrypted(request.getPasswordEncrypted());
                    if (request.getCategoryId() != null) {
                        categoryRepository.findById(request.getCategoryId()).ifPresent(cat -> {
                            if (cat.getUser().getId().equals(user.getId())) {
                                existing.setCategory(cat);
                            }
                        });
                    } else {
                        existing.setCategory(null);
                    }
                    PasswordItem saved = passwordRepository.save(existing);
                    return ResponseEntity.ok(toResponse(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        PasswordItem item = passwordRepository.findById(id)
                .filter(p -> p.getUser().getId().equals(user.getId()) && p.getDeletedAt() == null)
                .orElse(null);

        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        item.setDeletedAt(Instant.now());
        passwordRepository.deleteById(item.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/export")
    public ResponseEntity<PasswordExportResponse> exportPasswords(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String categoryId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        // Buscar senhas do usuário
        List<PasswordItem> passwords;
        if (categoryId != null && !categoryId.isEmpty()) {
            try {
                UUID categoryUuid = UUID.fromString(categoryId);
                passwords = passwordRepository.findAllByUser_IdAndCategory_IdAndDeletedAtIsNull(user.getId(), categoryUuid);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        } else {
            passwords = passwordRepository.findAllByUser_IdAndDeletedAtIsNull(user.getId());
        }

        PasswordExportResponse response = passwordCsvService.exportPasswords(user, passwords);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/import")
    public ResponseEntity<PasswordImportResponse> importPasswords(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean overwriteExisting,
            @RequestParam(required = false) String categoryMapping,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        // Validar arquivo
        if (file.isEmpty()) {
            PasswordImportResponse errorResponse = new PasswordImportResponse(
                0, 0, 1,
                List.of("Arquivo não pode estar vazio"),
                List.of(),
                "Arquivo vazio"
            );
            return ResponseEntity.badRequest().body(errorResponse);
        }

        PasswordImportResponse response = passwordCsvService.importPasswords(file, user, overwriteExisting);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadCsv(@PathVariable String filename, Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
            Path filePath = Paths.get(TEMP_DIR + filename);

            // Validar que o arquivo pertence ao usuário (verificar nome do arquivo)
            if (!filename.contains(user.getEmail().replace("@", "_"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private PasswordResponse toResponse(PasswordItem item) {
        return new PasswordResponse(
                item.getId(),
                item.getName(),
                item.getWebsite(),
                item.getUsername(),
                item.getPasswordEncrypted(),
                item.getCategory() != null ? item.getCategory().getId() : null,
                item.getLastUpdated(),
                item.getCreatedAt()
        );
    }
}