package com.lockwize.lockwize.dto.category;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
}
