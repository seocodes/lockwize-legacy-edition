package com.lockwize.lockwize.repositories;

import com.lockwize.lockwize.entities.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    Optional<EmailVerificationToken> findByTokenAndUsedFalse(String token);
    void deleteByExpiresAtBefore(Instant now);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken e WHERE e.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
