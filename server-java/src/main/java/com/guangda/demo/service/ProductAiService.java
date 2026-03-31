package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.config.AiProperties;
import com.guangda.demo.dto.ProductAiBriefRequest;
import com.guangda.demo.dto.ProductAiBriefResponse;
import com.guangda.demo.prompt.AiPromptTemplates;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class ProductAiService {

    private final AiClientService aiClientService;
    private final ProductAiBriefCacheService cacheService;
    private final ObjectMapper objectMapper;
    private final AiJsonExtractor aiJsonExtractor;
    private final AiProperties aiProperties;

    public ProductAiService(AiClientService aiClientService,
                            ProductAiBriefCacheService cacheService,
                            ObjectMapper objectMapper,
                            AiJsonExtractor aiJsonExtractor,
                            AiProperties aiProperties) {
        this.aiClientService = aiClientService;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
        this.aiJsonExtractor = aiJsonExtractor;
        this.aiProperties = aiProperties;
    }

    public ProductAiBriefResponse generateBrief(ProductAiBriefRequest request) {
        String cacheKey = buildCacheKey(request);
        ProductAiBriefResponse cached = cacheService.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        JsonNode root = aiClientService.generateJson(
                AiPromptTemplates.buildProductAiBriefPrompt(request, objectMapper),
                AiPromptTemplates.PRODUCT_AI_BRIEF_SYSTEM_PROMPT,
                0.2
        );

        ProductAiBriefResponse response = new ProductAiBriefResponse(
                aiJsonExtractor.text(root, "summary"),
                aiJsonExtractor.text(root, "suitableClientView"),
                arrayText(root.path("keyAttractions"), 4),
                arrayText(root.path("watchPoints"), 4),
                arrayText(root.path("comparisonHint"), 3)
        );

        cacheService.put(cacheKey, response, aiProperties.productBriefCacheMinutes());
        return response;
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

    private String buildCacheKey(ProductAiBriefRequest request) {
        return String.join("|",
                safe(request.productName()),
                safe(request.issuer()),
                safe(request.productType()),
                safe(request.riskLevel()),
                safe(request.investmentTerm()),
                safe(request.liquidity()),
                safe(request.strategy()),
                safe(request.benchmark()),
                safe(request.feeInfo()),
                safe(request.updatedAt()),
                safe(request.version()));
    }

    private String safe(String value) {
        return Objects.toString(value, "");
    }
}
