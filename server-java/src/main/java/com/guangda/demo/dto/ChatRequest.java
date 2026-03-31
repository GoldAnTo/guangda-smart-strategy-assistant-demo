package com.guangda.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record ChatRequest(
        @NotBlank(message = "question is required") String question,
        @NotNull(message = "context is required") Map<String, Object> context
) {
}
