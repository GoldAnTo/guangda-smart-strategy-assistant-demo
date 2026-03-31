package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.guangda.demo.dto.DemandProfile;
import com.guangda.demo.dto.ExcludedProduct;
import com.guangda.demo.dto.MatchProductsResponse;
import com.guangda.demo.dto.MatchedProduct;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MatchProductsService {

    private final ProductCatalogService productCatalogService;
    private final RuleService ruleService;

    public MatchProductsService(ProductCatalogService productCatalogService, RuleService ruleService) {
        this.productCatalogService = productCatalogService;
        this.ruleService = ruleService;
    }

    public MatchProductsResponse match(DemandProfile profile) {
        var escalation = ruleService.checkEscalation(profile);
        if (escalation.shouldEscalate()) {
            return new MatchProductsResponse(List.of(), List.of(), true, escalation.escalationType(), escalation.reason(), escalation.nextAction());
        }

        List<MatchedProduct> recommended = new ArrayList<>();
        List<ExcludedProduct> excluded = new ArrayList<>();

        for (JsonNode product : productCatalogService.getProducts()) {
            String productType = product.path("type").asText();
            if ("custom_account".equals(productType) && !"custom_need".equals(profile.goalTag())) {
                excluded.add(new ExcludedProduct(product.path("id").asText(), product.path("name").asText(), "当前客户需求优先匹配标准化产品"));
                continue;
            }

            var riskCheck = ruleService.checkRisk(profile, product);
            var durationCheck = ruleService.checkDuration(profile, product);
            var liquidityCheck = ruleService.checkLiquidity(profile, product);
            if (!riskCheck.allow() || !durationCheck.allow() || !liquidityCheck.allow()) {
                excluded.add(new ExcludedProduct(product.path("id").asText(), product.path("name").asText(), firstReason(riskCheck, durationCheck, liquidityCheck)));
                continue;
            }

            Map<String, Integer> scoreBreakdown = calculateScoreBreakdown(profile, product);
            int matchScore = scoreBreakdown.values().stream().mapToInt(Integer::intValue).sum();
            if (matchScore > 100) {
                matchScore = 100;
            }

            recommended.add(new MatchedProduct(
                    product.path("id").asText(),
                    product.path("name").asText(),
                    matchScore,
                    scoreBreakdown,
                    matchScore >= 90 ? "primary" : "backup",
                    matchReasons(profile, product),
                    product.path("benchmark").isMissingNode() ? null : product.path("benchmark")
            ));
        }

        recommended.sort(Comparator.comparingInt(MatchedProduct::matchScore).reversed());
        if (recommended.size() > 3) {
            recommended = new ArrayList<>(recommended.subList(0, 3));
        }

        return new MatchProductsResponse(recommended, excluded, false, "", "", "");
    }

    private Map<String, Integer> calculateScoreBreakdown(DemandProfile profile, JsonNode product) {
        int riskScore = "stable".equals(profile.riskLevel()) && "R2".equals(product.path("riskLevel").asText()) ? 30
                : "conservative".equals(profile.riskLevel()) && "R1".equals(product.path("riskLevel").asText()) ? 30
                : contains(product.path("targetClients"), profile.riskLevel()) ? 20 : 10;

        int durationScore = product.path("durationTag").asText().equals(profile.horizonTag()) ? 20 : 10;
        int liquidityScore = product.path("liquidityTag").asText().equals(profile.liquidityTag()) ? 20 : 10;
        int goalScore = "stable_enhancement".equals(profile.goalTag()) && "fixed_income_plus".equals(product.path("type").asText()) ? 20
                : "capital_stability".equals(profile.goalTag()) && "cash_enhancement".equals(product.path("type").asText()) ? 20
                : "portfolio_balance".equals(profile.goalTag()) && "pure_bond".equals(product.path("type").asText()) ? 18
                : 12;
        int balanceScore = "portfolio_balance".equals(profile.goalTag()) ? 10 : 5;

        Map<String, Integer> result = new LinkedHashMap<>();
        result.put("riskScore", riskScore);
        result.put("durationScore", durationScore);
        result.put("liquidityScore", liquidityScore);
        result.put("goalScore", goalScore);
        result.put("balanceScore", balanceScore);
        return result;
    }

    private List<String> matchReasons(DemandProfile profile, JsonNode product) {
        List<String> reasons = new ArrayList<>();
        if (product.path("durationTag").asText().equals(profile.horizonTag())) {
            reasons.add("期限匹配");
        }
        if (product.path("liquidityTag").asText().equals(profile.liquidityTag())) {
            reasons.add("流动性要求匹配");
        }
        if ("stable_enhancement".equals(profile.goalTag()) && "fixed_income_plus".equals(product.path("type").asText())) {
            reasons.add("稳健增厚目标匹配");
        }
        if ("stable".equals(profile.riskLevel()) && "R2".equals(product.path("riskLevel").asText())) {
            reasons.add("风险偏好匹配");
        }
        return reasons;
    }

    private boolean contains(JsonNode arrayNode, String value) {
        for (JsonNode item : arrayNode) {
            if (value.equals(item.asText())) {
                return true;
            }
        }
        return false;
    }

    private String firstReason(RuleService.RuleResult... results) {
        for (RuleService.RuleResult result : results) {
            if (!result.allow()) {
                return result.reason();
            }
        }
        return "不满足当前匹配条件";
    }
}
