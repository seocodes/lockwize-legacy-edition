package com.lockwize.lockwize.repositories;

import com.lockwize.lockwize.entities.PasswordItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordRepository extends JpaRepository<PasswordItem, UUID> {
    List<PasswordItem> findAllByUser_IdAndDeletedAtIsNull(UUID userId);
    List<PasswordItem> findAllByUser_IdAndCategory_IdAndDeletedAtIsNull(UUID userId, UUID categoryId);
    Optional<PasswordItem> findByUser_IdAndNameAndUsername(UUID userId, String name, String username);
}