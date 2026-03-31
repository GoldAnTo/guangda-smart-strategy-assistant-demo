package com.guangda.demo.dto;

import java.util.List;

public record ExtractPreferenceResponse(
        PreferenceProfileDraft customerProfileDraft,
        List<String> missingFields,
        double confidence,
        List<String> nextQuestions
) {
}
