package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

@Component
public class AiJsonExtractor {

    public String unwrap(String raw) {
        if (raw == null || raw.isBlank()) {
            return "{}";
        }
        return raw.replace("```json", "")
                .replace("```", "")
                .trim();
    }

    public String text(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isTextual() ? value.asText().trim() : "";
    }
}
