package com.guangda.demo.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ProductAiBriefRequest(
        @NotBlank(message = "productName is required") String productName,
        String issuer,
        String productType,
        String riskLevel,
        String investmentTerm,
        String liquidity,
        String targetCustomer,
        String strategy,
        String assetAllocation,
        String benchmark,
        String feeInfo,
        List<String> highlightTags,
        String importantNotes,
        String updatedAt,
        String version
) {
}
