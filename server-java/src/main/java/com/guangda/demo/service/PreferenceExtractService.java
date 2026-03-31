package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.ChatMessage;
import com.guangda.demo.dto.ExtractPreferenceRequest;
import com.guangda.demo.dto.ExtractPreferenceResponse;
import com.guangda.demo.dto.PreferenceProfileDraft;
import com.guangda.demo.prompt.AiPromptTemplates;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PreferenceExtractService {

    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;
    private final AiJsonExtractor aiJsonExtractor;

    public PreferenceExtractService(AiClientService aiClientService,
                                    ObjectMapper objectMapper,
                                    AiJsonExtractor aiJsonExtractor) {
        this.aiClientService = aiClientService;
        this.objectMapper = objectMapper;
        this.aiJsonExtractor = aiJsonExtractor;
    }

    public ExtractPreferenceResponse extract(ExtractPreferenceRequest request) {
        boolean incremental = request.currentProfileDraft() != null
                && request.latestMessages() != null
                && !request.latestMessages().isEmpty();

        JsonNode root = incremental
                ? aiClientService.generateJson(
                AiPromptTemplates.buildIncrementalExtractPreferencePrompt(request, objectMapper),
                AiPromptTemplates.EXTRACT_PREFERENCE_INCREMENTAL_SYSTEM_PROMPT,
                0.1)
                : aiClientService.generateJson(
                AiPromptTemplates.buildExtractPreferencePrompt(normalizeConversation(request), objectMapper),
                AiPromptTemplates.EXTRACT_PREFERENCE_SYSTEM_PROMPT,
                0.1);

        return new ExtractPreferenceResponse(
                toDraft(root.path("customerProfileDraft")),
                arrayText(root.path("missingFields"), 5),
                normalizeConfidence(root.path("confidence").asDouble(0)),
                arrayText(root.path("nextQuestions"), 4)
        );
    }

    private ExtractPreferenceRequest normalizeConversation(ExtractPreferenceRequest request) {
        if (request.conversationText() != null && !request.conversationText().isBlank()) {
            return request;
        }
        StringBuilder builder = new StringBuilder();
        if (request.messages() != null) {
            for (ChatMessage message : request.messages()) {
                if (message != null && message.content() != null && !message.content().isBlank()) {
                    builder.append(message.role()).append(": ").append(message.content()).append("\n");
                }
            }
        }
        return new ExtractPreferenceRequest(
                request.customerId(),
                request.customerAgeRange(),
                request.aumLevel(),
                request.existingRiskLevel(),
                builder.toString().trim(),
                request.messages(),
                request.currentProfileDraft(),
                request.latestMessages()
        );
    }

    private PreferenceProfileDraft toDraft(JsonNode node) {
        return new PreferenceProfileDraft(
                aiJsonExtractor.text(node, "riskTolerance"),
                aiJsonExtractor.text(node, "investmentHorizon"),
                aiJsonExtractor.text(node, "liquidityNeed"),
                aiJsonExtractor.text(node, "returnExpectation"),
                aiJsonExtractor.text(node, "drawdownSensitivity"),
                aiJsonExtractor.text(node, "allocationPurpose"),
                arrayText(node.path("specialConstraints"), 5)
        );
    }

    private List<String> arrayText(JsonNode node, int max) {
        List<String> result = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return result;
        }
        for (JsonNode item : node) {
            if (item.isTextual() && !item.asText().isBlank()) {
                result.add(item.asText().trim());
                if (result.size() >= max) {
                    break;
                }
            }
        }
        return result;
    }

    private double normalizeConfidence(double value) {
        if (value < 0) {
            return 0;
        }
        if (value > 1) {
            return 1;
        }
        return Math.round(value * 100.0) / 100.0;
    }
}
