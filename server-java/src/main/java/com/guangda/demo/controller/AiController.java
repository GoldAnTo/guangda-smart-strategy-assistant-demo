package com.guangda.demo.controller;

import com.guangda.demo.api.ApiResponse;
import com.guangda.demo.api.TraceIdFilter;
import com.guangda.demo.dto.ExtractPreferenceRequest;
import com.guangda.demo.dto.ExtractPreferenceResponse;
import com.guangda.demo.dto.ProductAiBriefRequest;
import com.guangda.demo.dto.ProductAiBriefResponse;
import com.guangda.demo.service.PreferenceExtractService;
import com.guangda.demo.service.ProductAiService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping
public class AiController {

    private final ProductAiService productAiService;
    private final PreferenceExtractService preferenceExtractService;

    public AiController(ProductAiService productAiService,
                        PreferenceExtractService preferenceExtractService) {
        this.productAiService = productAiService;
        this.preferenceExtractService = preferenceExtractService;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health(HttpServletRequest request) {
        return ApiResponse.success(Map.of("ok", true, "service", "guangda-strategy-demo-java"), traceId(request));
    }

    @GetMapping("/ready")
    public ApiResponse<Map<String, Object>> ready(HttpServletRequest request) {
        return ApiResponse.success(Map.of("ready", true), traceId(request));
    }

    @PostMapping("/api/product-ai-brief")
    public ApiResponse<ProductAiBriefResponse> productAiBrief(@Valid @RequestBody ProductAiBriefRequest body,
                                                              HttpServletRequest request) {
        return ApiResponse.success(productAiService.generateBrief(body), traceId(request));
    }

    @PostMapping("/api/extract-preference")
    public ApiResponse<ExtractPreferenceResponse> extractPreference(@RequestBody ExtractPreferenceRequest body,
                                                                    HttpServletRequest request) {
        return ApiResponse.success(preferenceExtractService.extract(body), traceId(request));
    }

    private String traceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(TraceIdFilter.TRACE_ID_ATTR);
        return traceId == null ? "" : traceId.toString();
    }
}
