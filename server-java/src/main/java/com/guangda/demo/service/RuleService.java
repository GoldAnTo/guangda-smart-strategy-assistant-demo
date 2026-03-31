package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.DemandProfile;
import com.guangda.demo.dto.EscalationDecision;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class RuleService {

    private final JsonNode root;

    public RuleService(ObjectMapper objectMapper) {
        try (InputStream inputStream = new ClassPathResource("data/rules.json").getInputStream()) {
            this.root = objectMapper.readTree(inputStream);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load rules.json", e);
        }
    }

    public EscalationDecision checkEscalation(DemandProfile profile) {
        if ("custom_need".equals(profile.goalTag())) {
            return new EscalationDecision(true, "custom_account", "客户需求更适合专户/定制服务流程", "建议转专户服务经理进一步确认客户约束条件与定制需求");
        }
        if ("holding_explanation".equals(profile.goalTag())) {
            return new EscalationDecision(true, "holding_explanation", "当前场景更适合持有中产品解释流程", "建议由客户经理结合持仓产品与净值波动情况做解释沟通");
        }
        return new EscalationDecision(false, "", "", "");
    }

    public RuleResult checkRisk(DemandProfile profile, JsonNode product) {
        for (JsonNode rule : root.path("riskRules")) {
            if (profile.riskLevel().equals(rule.path("customerRisk").asText())
                    && product.path("riskLevel").asText().equals(rule.path("productRisk").asText())) {
                return new RuleResult(rule.path("allow").asBoolean(true), rule.path("reason").asText(""));
            }
        }
        return new RuleResult(true, "");
    }

    public RuleResult checkDuration(DemandProfile profile, JsonNode product) {
        for (JsonNode rule : root.path("durationRules")) {
            if (profile.horizonTag().equals(rule.path("horizonTag").asText())) {
                boolean forbidden = contains(rule.path("forbiddenProductDurationTags"), product.path("durationTag").asText());
                return new RuleResult(!forbidden, forbidden ? rule.path("reason").asText("") : "");
            }
        }
        return new RuleResult(true, "");
    }

    public RuleResult checkLiquidity(DemandProfile profile, JsonNode product) {
        for (JsonNode rule : root.path("liquidityRules")) {
            if (profile.liquidityTag().equals(rule.path("liquidityNeed").asText())) {
                boolean forbidden = contains(rule.path("forbiddenProductLiquidityTags"), product.path("liquidityTag").asText());
                return new RuleResult(!forbidden, forbidden ? rule.path("reason").asText("") : "");
            }
        }
        return new RuleResult(true, "");
    }

    public boolean checkChatEscalation(String question) {
        List<String> sensitiveWords = List.of("投诉", "保本", "收益保证", "是不是有问题", "亏了怎么办", "直接买哪个", "直接推荐", "拍板", "保证收益");
        List<String> finalDecisionWords = List.of("适合我买吗", "选哪个", "哪个最好", "直接告诉我买哪个");
        return sensitiveWords.stream().anyMatch(question::contains) || finalDecisionWords.stream().anyMatch(question::contains);
    }

    private boolean contains(JsonNode arrayNode, String value) {
        for (JsonNode node : arrayNode) {
            if (value.equals(node.asText())) {
                return true;
            }
        }
        return false;
    }

    public record RuleResult(boolean allow, String reason) {
    }
}
