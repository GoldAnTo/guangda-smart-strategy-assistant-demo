package com.guangda.demo.dto;

import java.util.List;

public record PreferenceProfileDraft(
        String riskTolerance,
        String investmentHorizon,
        String liquidityNeed,
        String returnExpectation,
        String drawdownSensitivity,
        String allocationPurpose,
        List<String> specialConstraints
) {
}
