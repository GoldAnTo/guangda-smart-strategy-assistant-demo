package com.guangda.demo.dto;

public record ChatResponse(String answer, boolean complianceChecked, boolean shouldEscalate) {
}
