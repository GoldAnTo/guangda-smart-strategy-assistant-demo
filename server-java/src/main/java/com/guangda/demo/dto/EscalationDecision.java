package com.guangda.demo.dto;

public record EscalationDecision(boolean shouldEscalate, String escalationType, String reason, String nextAction) {
}
