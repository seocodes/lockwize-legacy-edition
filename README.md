# Lockwize Legacy

Lockwize Legacy is a full-stack password manager built as a study project with React, Tailwind CSS, Spring Boot, Spring Security, JWT authentication, and JPA.

This repository is a clean public snapshot of a legacy version of the project. The original private development history was intentionally not preserved because it included local setup, deployment configuration, and work-in-progress files that were not suitable for a public portfolio repository.

## Project Context

This project represents an earlier version of Lockwize and is kept public as a learning milestone. It shows the evolution from a working full-stack prototype toward a more mature refactor with stronger architecture, security review, and production-oriented practices.

The refactored version is intended to be the production-facing evolution of this work. This repository documents what was already implemented in the legacy codebase and keeps the original prototype available for review.

## Status

* Legacy codebase kept for reference, learning, and future refactor work.
* Public repository starts from a clean snapshot, so the commit history does not reflect the original private development process.
* Refactor planning documents and local development notes are intentionally not tracked in this repository.
* Not recommended for production use as-is.

## Security Notice

This project should be treated as legacy demo code, not as a production password manager.

Known areas that need review before real-world use:

* Vault/password-item encryption model.
* Rate limiting.
* CSRF/security headers.
* Dependency upgrades.
* Automated security and integration tests.
* Production-grade secret management and deployment hardening.

Before deploying your own fork:

* Set all secrets through environment variables.
* Use a strong `JWT_SECRET`.
* Review how password vault entries are protected before storage.
* Do not commit `.env`, IDE files, build artifacts, local docs, or deployment-specific configuration.

## Portfolio Summary

This project demonstrates practical experience with full-stack application development, authentication, REST API design, database persistence, frontend state management, user-specific data access, deployment-oriented configuration, and the security tradeoffs involved in building applications that handle sensitive user data.

## Why One Commit?

The original private repository history showed the project evolution, but it also included local setup, deployment configuration, and work-in-progress files that were not appropriate for a public portfolio repository.

For that reason, this repository was published as a clean snapshot. The goal is to make the implemented code reviewable while keeping the public repository focused, safe, and easy to understand.
