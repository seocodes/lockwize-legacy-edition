package com.lockwize.lockwize.dto.csv;

import lombok.Data;

@Data
public class PasswordCsvRow {
    private String name;
    private String website;
    private String username;
    private String password;
    private String categoryName;
    private String notes;
    private String createdAt;
    private String lastUpdated;
}