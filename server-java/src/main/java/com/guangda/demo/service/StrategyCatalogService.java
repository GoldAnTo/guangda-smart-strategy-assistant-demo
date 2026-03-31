package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class StrategyCatalogService {

    private final List<JsonNode> strategies;

    public StrategyCatalogService(ObjectMapper objectMapper) {
        try (InputStream inputStream = new ClassPathResource("data/strategies.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(inputStream);
            JsonNode strategyArray = root.path("strategies");
            List<JsonNode> list = new ArrayList<>();
            strategyArray.forEach(list::add);
            this.strategies = List.copyOf(list);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load strategies.json", e);
        }
    }

    public List<JsonNode> getStrategies() {
        return strategies;
    }

    public JsonNode getStrategyById(String id) {
        return strategies.stream()
                .filter(s -> s.path("seed").asText().equals(id) || s.path("_sk_strategy").asText().equals(id))
                .findFirst()
                .orElse(null);
    }
}
