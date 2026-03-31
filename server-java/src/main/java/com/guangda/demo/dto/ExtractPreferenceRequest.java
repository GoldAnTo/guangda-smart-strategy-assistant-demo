package com.guangda.demo.dto;

import java.util.List;

public record ExtractPreferenceRequest(
        String customerId,
        String customerAgeRange,
        String aumLevel,
        String existingRiskLevel,
        String conversationText,
        List<ChatMessage> messages,
        PreferenceProfileDraft currentProfileDraft,
        List<ChatMessage> latestMessages
) {
}
