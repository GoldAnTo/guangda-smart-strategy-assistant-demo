package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.config.AiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class AiClientService {

    private static final Logger log = LoggerFactory.getLogger(AiClientService.class);
    private static final String JSON_ONLY_SYSTEM_PROMPT = "You must output valid JSON only. Do not include markdown fences or extra commentary.";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;
    private final AiJsonExtractor aiJsonExtractor;
    private final TextEncodingRepairService textEncodingRepairService;

    public AiClientService(HttpClient httpClient,
                           ObjectMapper objectMapper,
                           AiProperties aiProperties,
                           AiJsonExtractor aiJsonExtractor,
                           TextEncodingRepairService textEncodingRepairService) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.aiProperties = aiProperties;
        this.aiJsonExtractor = aiJsonExtractor;
        this.textEncodingRepairService = textEncodingRepairService;
    }

    public JsonNode generateJson(String prompt, String systemPrompt, double temperature) {
        String raw = requestModel(prompt, systemPrompt + "\n" + JSON_ONLY_SYSTEM_PROMPT, temperature);
        try {
            return objectMapper.readTree(aiJsonExtractor.unwrap(raw));
        } catch (IOException first) {
            String retryRaw = requestModel(prompt + "\n\n再次强调：只能输出合法 JSON。", systemPrompt + "\n" + JSON_ONLY_SYSTEM_PROMPT, temperature);
            try {
                return objectMapper.readTree(aiJsonExtractor.unwrap(retryRaw));
            } catch (IOException second) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI returned invalid JSON");
            }
        }
    }

    public String generateText(String prompt, String systemPrompt, double temperature) {
        return requestModel(prompt, systemPrompt, temperature);
    }

    private String requestModel(String prompt, String systemPrompt, double temperature) {
        if (aiProperties.apiKey() == null || aiProperties.apiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MODEL_API_KEY is missing");
        }

        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "model", aiProperties.modelName(),
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", temperature
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiProperties.apiUrl()))
                    .timeout(Duration.ofMillis(aiProperties.timeoutMs()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + aiProperties.apiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            logResponseSample(response);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                dumpRawResponse(response, "non-2xx");
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "AI request failed: " + response.statusCode());
            }

            JsonNode root;
            try {
                root = objectMapper.readTree(response.body());
            } catch (IOException parseError) {
                dumpRawResponse(response, "json-parse-error");
                throw parseError;
            }
            String content = root.path("choices").path(0).path("message").path("content").asText("{}");
            String normalizedContent = textEncodingRepairService.normalize(content);
            if (normalizedContent.isBlank() || normalizedContent.contains("����") || normalizedContent.indexOf('\uFFFD') >= 0) {
                dumpRawResponse(response, "content-mojibake");
            }
            return normalizedContent;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service temporarily unavailable");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service temporarily unavailable");
        }
    }

    private void logResponseSample(HttpResponse<byte[]> response) {
        String contentType = response.headers().firstValue("Content-Type").orElse("");
        String decoded = new String(response.body(), StandardCharsets.UTF_8);
        log.info("AI upstream content-type={}, decoded-sample={}", contentType, textEncodingRepairService.sample(decoded, 160));
    }

    private void dumpRawResponse(HttpResponse<byte[]> response, String reason) {
        try {
            Path dumpDir = Paths.get("run-logs", "ai-dumps");
            Files.createDirectories(dumpDir);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS"));
            String baseName = timestamp + "-" + reason;

            Files.write(dumpDir.resolve(baseName + ".bin"), response.body());

            String utf8 = new String(response.body(), StandardCharsets.UTF_8);
            String gbk = new String(response.body(), Charset.forName("GBK"));
            String gb18030 = new String(response.body(), Charset.forName("GB18030"));
            String iso = new String(response.body(), StandardCharsets.ISO_8859_1);

            String report = "content-type=" + response.headers().firstValue("Content-Type").orElse("") + "\n"
                    + "status=" + response.statusCode() + "\n\n"
                    + "utf8=\n" + utf8 + "\n\n"
                    + "gbk=\n" + gbk + "\n\n"
                    + "gb18030=\n" + gb18030 + "\n\n"
                    + "iso8859_1=\n" + iso + "\n\n"
                    + "base64=\n" + Base64.getEncoder().encodeToString(response.body());

            Files.writeString(dumpDir.resolve(baseName + ".txt"), report, StandardCharsets.UTF_8);
            log.warn("Dumped raw AI response for reason={} at {}", reason, dumpDir.resolve(baseName + ".txt"));
        } catch (Exception dumpError) {
            log.warn("Failed to dump raw AI response: {}", dumpError.getMessage());
        }
    }
}
