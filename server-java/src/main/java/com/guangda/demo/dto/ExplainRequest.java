package com.guangda.demo.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record ExplainRequest(
        @NotNull(message = "profile is required") Map<String, Object> profile,
        @NotNull(message = "recommended is required") List<Map<String, Object>> recommended,
        List<Map<String, Object>> excluded
) {
}
