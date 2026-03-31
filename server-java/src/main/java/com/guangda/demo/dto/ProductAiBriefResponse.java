package com.guangda.demo.dto;

import java.util.List;

public record ProductAiBriefResponse(
        String summary,
        String suitableClientView,
        List<String> keyAttractions,
        List<String> watchPoints,
        List<String> comparisonHint
) {
}
