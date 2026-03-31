package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guangda.demo.dto.ChatResponse;
import com.guangda.demo.dto.ExplanationResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ComplianceService {

    private static final List<String> FORBIDDEN_WORDS = List.of("保本", "稳赚", "确定收益", "不会亏", "几乎没风险");

    public ExplanationResponse cleanExplanation(JsonNode root, AiJsonExtractor extractor) {
        List<String> whyNot = new ArrayList<>();
        JsonNode whyNotNode = root.path("whyNot");
        if (whyNotNode.isArray()) {
            for (JsonNode item : whyNotNode) {
                if (item.isTextual()) {
                    whyNot.add(stripForbiddenWords(item.asText()));
                }
            }
        }

        String riskNotice = stripForbiddenWords(extractor.text(root, "riskNotice"));
        if (riskNotice.isBlank()) {
            riskNotice = "相关产品不保证收益，净值可能随市场变化出现波动。";
        }

        return new ExplanationResponse(
                stripForbiddenWords(extractor.text(root, "summary")),
                stripForbiddenWords(extractor.text(root, "clientExplanation")),
                stripForbiddenWords(extractor.text(root, "internalNotes")),
                riskNotice,
                whyNot
        );
    }

    public ChatResponse cleanChatAnswer(String answer, boolean shouldEscalate) {
        String cleaned = stripForbiddenWords(answer);
        if (cleaned.isBlank()) {
            cleaned = "建议结合客户具体情况进一步确认。";
        }
        return new ChatResponse(cleaned, true, shouldEscalate);
    }

    private String stripForbiddenWords(String text) {
        String result = text == null ? "" : text;
        for (String word : FORBIDDEN_WORDS) {
            result = result.replace(word, "");
        }
        return result.trim();
    }
}
