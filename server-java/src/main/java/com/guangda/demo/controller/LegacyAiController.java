package com.guangda.demo.controller;

import com.guangda.demo.api.ApiResponse;
import com.guangda.demo.api.TraceIdFilter;
import com.guangda.demo.dto.AnalyzeDemandResponse;
import com.guangda.demo.dto.ChatRequest;
import com.guangda.demo.dto.ChatResponse;
import com.guangda.demo.dto.ExplainRequest;
import com.guangda.demo.dto.ExplanationResponse;
import com.guangda.demo.dto.MatchProductsRequest;
import com.guangda.demo.dto.MatchProductsResponse;
import com.guangda.demo.service.ChatService;
import com.guangda.demo.service.DemandAnalyzeService;
import com.guangda.demo.service.ExplanationService;
import com.guangda.demo.service.MatchProductsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class LegacyAiController {

    private final DemandAnalyzeService demandAnalyzeService;
    private final MatchProductsService matchProductsService;
    private final ExplanationService explanationService;
    private final ChatService chatService;

    public LegacyAiController(DemandAnalyzeService demandAnalyzeService,
                              MatchProductsService matchProductsService,
                              ExplanationService explanationService,
                              ChatService chatService) {
        this.demandAnalyzeService = demandAnalyzeService;
        this.matchProductsService = matchProductsService;
        this.explanationService = explanationService;
        this.chatService = chatService;
    }

    @PostMapping("/analyze-demand")
    public ApiResponse<AnalyzeDemandResponse> analyzeDemand(@RequestBody Map<String, Object> input,
                                                            HttpServletRequest request) {
        return ApiResponse.success(demandAnalyzeService.analyze(input), traceId(request));
    }

    @PostMapping("/match-products")
    public ApiResponse<MatchProductsResponse> matchProducts(@Valid @RequestBody MatchProductsRequest body,
                                                            HttpServletRequest request) {
        return ApiResponse.success(matchProductsService.match(body.profile()), traceId(request));
    }

    @PostMapping("/generate-explanation")
    public ApiResponse<ExplanationResponse> generateExplanation(@Valid @RequestBody ExplainRequest body,
                                                                HttpServletRequest request) {
        return ApiResponse.success(explanationService.generate(body), traceId(request));
    }

    @PostMapping("/chat")
    public ApiResponse<ChatResponse> chat(@Valid @RequestBody ChatRequest body,
                                          HttpServletRequest request) {
        return ApiResponse.success(chatService.chat(body), traceId(request));
    }

    private String traceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(TraceIdFilter.TRACE_ID_ATTR);
        return traceId == null ? "" : traceId.toString();
    }
}
