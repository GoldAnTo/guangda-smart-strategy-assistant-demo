package com.guangda.demo.dto;

import java.util.List;

public record DemandProfile(
        String customerType,
        String riskLevel,
        String horizonTag,
        String liquidityTag,
        String goalTag,
        String drawdownTolerance,
        boolean needsFollowUp,
        List<String> followUpQuestions
) {
}
