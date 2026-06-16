package com.lockwize.lockwize.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "passwords")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordItem {

    @Id
    @GeneratedValue
    private UUID id;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String website;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String username;

    @Column(name = "password_encrypted", nullable = false, columnDefinition = "TEXT")
    private String passwordEncrypted;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Column(name = "last_updated")
    private Instant lastUpdated;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.lastUpdated = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.lastUpdated = Instant.now();
    }

}
