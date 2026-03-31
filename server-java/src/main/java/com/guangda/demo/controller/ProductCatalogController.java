package com.guangda.demo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.guangda.demo.api.ApiResponse;
import com.guangda.demo.api.TraceIdFilter;
import com.guangda.demo.service.ProductCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProductCatalogController {

    private static final Logger log = LoggerFactory.getLogger(ProductCatalogController.class);
    private final ProductCatalogService productCatalogService;

    public ProductCatalogController(ProductCatalogService productCatalogService) {
        this.productCatalogService = productCatalogService;
        log.info("ProductCatalogController initialized, service has {} products", productCatalogService.getProducts().size());
    }

    @GetMapping("/products")
    public ApiResponse<Object> listProducts(HttpServletRequest request) {
        log.info("listProducts called");
        return ApiResponse.success(productCatalogService.getProducts(), traceId(request));
    }

    @GetMapping("/products/{id}")
    public ApiResponse<Object> getProduct(@PathVariable("id") String id, HttpServletRequest request) {
        log.info(">>> getProduct ENTRY with id={}", id);
        try {
            JsonNode product = productCatalogService.getProductById(id);
            log.info("getProductById returned: {}", product != null ? "found" : "null");
            if (product == null) {
                return ApiResponse.error(404, "产品不存在: " + id, traceId(request));
            }
            return ApiResponse.success(product, traceId(request));
        } catch (Exception e) {
            log.error("getProduct exception for id={}: {}", id, e.getMessage(), e);
            return ApiResponse.error(500, "internal error: " + e.getMessage(), traceId(request));
        }
    }

    private String traceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(TraceIdFilter.TRACE_ID_ATTR);
        return traceId == null ? "" : traceId.toString();
    }
}
