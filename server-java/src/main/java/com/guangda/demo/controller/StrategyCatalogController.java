package com.guangda.demo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guangda.demo.api.ApiResponse;
import com.guangda.demo.api.TraceIdFilter;
import com.guangda.demo.service.StrategyCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StrategyCatalogController {

    private final StrategyCatalogService strategyCatalogService;

    public StrategyCatalogController(StrategyCatalogService strategyCatalogService) {
        this.strategyCatalogService = strategyCatalogService;
    }

    @GetMapping("/strategies")
    public ApiResponse<Object> listStrategies(HttpServletRequest request) {
        return ApiResponse.success(strategyCatalogService.getStrategies(), traceId(request));
    }

    @GetMapping("/strategies/{id}")
    public ApiResponse<Object> getStrategy(@PathVariable("id") String id, HttpServletRequest request) {
        JsonNode strategy = strategyCatalogService.getStrategyById(id);
        if (strategy == null) {
            return ApiResponse.error(404, "策略不存在: " + id, traceId(request));
        }
        return ApiResponse.success(strategy, traceId(request));
    }

    private String traceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(TraceIdFilter.TRACE_ID_ATTR);
        return traceId == null ? "" : traceId.toString();
    }
}
