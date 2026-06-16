package com.lockwize.lockwize.dto.auth;

// lombok: ja define getters, setters e contruct
import lombok.AllArgsConstructor;
import lombok.Data;

@Data // lombok
@AllArgsConstructor // lomboks
public class AuthResponse {
    private String token;
}
