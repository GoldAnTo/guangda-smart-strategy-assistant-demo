package com.guangda.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai")
public record AiProperties(
        String apiUrl,
        String apiKey,
        String modelName,
        int timeoutMs,
        int productBriefCacheMinutes
) {
}
