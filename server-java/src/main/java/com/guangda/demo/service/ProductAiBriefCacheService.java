package com.guangda.demo.service;

import com.guangda.demo.dto.ProductAiBriefResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProductAiBriefCacheService {

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public ProductAiBriefResponse get(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            return null;
        }
        if (Instant.now().isAfter(entry.expiredAt())) {
            cache.remove(key);
            return null;
        }
        return entry.value();
    }

    public void put(String key, ProductAiBriefResponse value, long ttlMinutes) {
        cache.put(key, new CacheEntry(value, Instant.now().plusSeconds(ttlMinutes * 60)));
    }

    private record CacheEntry(ProductAiBriefResponse value, Instant expiredAt) {
    }
}
