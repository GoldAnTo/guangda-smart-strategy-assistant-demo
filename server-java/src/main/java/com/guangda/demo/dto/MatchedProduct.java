package com.guangda.demo.dto;

import java.util.List;
import java.util.Map;

public record MatchedProduct(
        String productId,
        String productName,
        int matchScore,
        Map<String, Integer> scoreBreakdown,
        String priority,
        List<String> matchReasons,
        Object benchmark
) {
}
