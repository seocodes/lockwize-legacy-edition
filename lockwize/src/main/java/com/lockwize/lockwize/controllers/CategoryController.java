package com.lockwize.lockwize.controllers;

import com.lockwize.lockwize.dto.category.CategoryRequest;
import com.lockwize.lockwize.dto.category.CategoryResponse;
import com.lockwize.lockwize.entities.Category;
import com.lockwize.lockwize.entities.User;
import com.lockwize.lockwize.repositories.CategoryRepository;
import com.lockwize.lockwize.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryController(CategoryRepository categoryRepository, UserRepository userRepository){
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<CategoryResponse> list(Authentication authentication){
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return categoryRepository.findAllByUser_Id(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> get(@PathVariable UUID id, Authentication authentication){
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Optional<Category> category = categoryRepository.findById(id)
                .filter(c -> c.getUser().getId().equals(user.getId()));
        return category.map(c -> ResponseEntity.ok(toResponse(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request, Authentication authentication){
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Category category = new Category();
        category.setName(request.getName());
        category.setUser(user);
        Category saved = categoryRepository.save(category);
        return ResponseEntity.created(URI.create("/api/categories/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return categoryRepository.findById(id)
                .filter(existing -> existing.getUser().getId().equals(user.getId()))
                .map(existing -> {
                    existing.setName(request.getName());
                    Category saved = categoryRepository.save(existing);
                    return ResponseEntity.ok(toResponse(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Optional<Category> categoryOpt = categoryRepository.findById(id)
                .filter(c -> c.getUser().getId().equals(user.getId()));

        if (categoryOpt.isPresent()) {
            categoryRepository.delete(categoryOpt.get());
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName()
        );
    }
}
