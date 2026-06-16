package com.lockwize.lockwize.repositories;

import com.lockwize.lockwize.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findAllByUser_Id(UUID userID);
    Optional<Category> findByUser_IdAndName(UUID userId, String name);
}