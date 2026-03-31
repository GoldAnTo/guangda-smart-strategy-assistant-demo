package com.guangda.demo.dto;

public record ChatMessage(String role, String content, String timestamp) {

    @Override
    public String toString() {
        return (role == null ? "unknown" : role) + ": " + (content == null ? "" : content);
    }
}
