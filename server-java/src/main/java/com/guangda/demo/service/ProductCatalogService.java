package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductCatalogService {

    private final List<JsonNode> products;

    public ProductCatalogService(ObjectMapper objectMapper) {
        try (InputStream inputStream = new ClassPathResource("data/products.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(inputStream);
            List<JsonNode> list = new ArrayList<>();
            root.forEach(list::add);
            this.products = List.copyOf(list);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load products.json", e);
        }
    }

    public List<JsonNode> getProducts() {
        return products;
    }

    public JsonNode getProductById(String id) {
        return products.stream()
                .filter(p -> p.path("id").asText().equals(id))
                .findFirst()
                .orElse(null);
    }
}
