package com.guangda.demo.dto;

import java.util.List;

public record MatchProductsResponse(
        List<MatchedProduct> recommended,
        List<ExcludedProduct> excluded,
        boolean shouldEscalate,
        String escalationType,
        String escalationReason,
        String nextAction
) {
}
