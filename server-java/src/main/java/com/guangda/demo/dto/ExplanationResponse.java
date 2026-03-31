package com.guangda.demo.dto;

import java.util.List;

public record ExplanationResponse(
        String summary,
        String clientExplanation,
        String internalNotes,
        String riskNotice,
        List<String> whyNot
) {
}
