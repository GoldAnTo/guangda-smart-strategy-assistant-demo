package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.AnalyzeDemandResponse;
import com.guangda.demo.dto.DemandProfile;
import com.guangda.demo.prompt.AiPromptTemplates;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DemandAnalyzeService {

    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;
    private final AiJsonExtractor aiJsonExtractor;

    public DemandAnalyzeService(AiClientService aiClientService,
                                ObjectMapper objectMapper,
                                AiJsonExtractor aiJsonExtractor) {
        this.aiClientService = aiClientService;
        this.objectMapper = objectMapper;
        this.aiJsonExtractor = aiJsonExtractor;
    }

    public AnalyzeDemandResponse analyze(Map<String, Object> input) {
        String prompt = buildDemandPrompt(input);
        JsonNode root = aiClientService.generateJson(prompt, "You must output valid JSON only. Do not include markdown fences or extra commentary.", 0.2);
        return new AnalyzeDemandResponse(parseProfile(root));
    }

    private String buildDemandPrompt(Map<String, Object> input) {
        try {
            String payload = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(input);
            return "你是“光大资管智能策略推荐助手”中的客户偏好识别模块。\n\n" +
                    "你的职责不是推荐产品，也不是给最终结论，而是把客户输入整理成后续可用于筛选方向的结构化偏好标签。\n\n" +
                    "你必须严格输出 JSON，不得输出任何额外解释、前缀、注释或 markdown。\n\n" +
                    "输出字段固定为：\n- customerType\n- riskLevel\n- horizonTag\n- liquidityTag\n- goalTag\n- drawdownTolerance\n- needsFollowUp\n- followUpQuestions\n\n" +
                    "字段约束如下：\n" +
                    "- customerType: individual | high_net_worth | institutional\n" +
                    "- riskLevel: conservative | stable | balanced | aggressive | custom\n" +
                    "- horizonTag: short_term | mid_term | long_term | custom\n" +
                    "- liquidityTag: high | medium | medium_low | low | custom\n" +
                    "- goalTag: capital_stability | stable_enhancement | balanced_growth | high_return | custom_need | holding_explanation | portfolio_balance\n" +
                    "- drawdownTolerance: very_low | low | medium | high\n" +
                    "- followUpQuestions 必须是字符串数组，最多 3 条\n\n" +
                    "识别原则：\n" +
                    "- 如果客户表达“先看看方向、先了解、还不确定怎么选”，不要直接理解为明确推荐需求，而是正常识别偏好标签\n" +
                    "- 同时表达“高收益”和“不能亏/最好别波动/不要回撤”时，needsFollowUp=true\n" +
                    "- 明确表达需要定制、不要标准产品时，goalTag=custom_need\n" +
                    "- 询问持有中产品波动、回撤、净值问题时，goalTag=holding_explanation\n" +
                    "- 已有较多权益资产并说新增资金想更稳，可优先理解为 portfolio_balance\n" +
                    "- 如果信息不够形成稳定判断，则 needsFollowUp=true，并生成最多 3 条最关键的追问\n" +
                    "- followUpQuestions 的语气要自然，像顾问补问，不像问卷系统\n" +
                    "- 不要生成产品推荐\n" +
                    "- 不要承诺收益\n" +
                    "- 只输出合法 JSON\n\n" +
                    "客户输入如下：\n" + payload;
        } catch (Exception e) {
            return "客户输入如下：{}";
        }
    }

    private DemandProfile parseProfile(JsonNode root) {
        return new DemandProfile(
                fallback(extractorText(root, "customerType"), "individual"),
                fallback(extractorText(root, "riskLevel"), "stable"),
                fallback(extractorText(root, "horizonTag"), "mid_term"),
                fallback(extractorText(root, "liquidityTag"), "medium"),
                fallback(extractorText(root, "goalTag"), "stable_enhancement"),
                fallback(extractorText(root, "drawdownTolerance"), "low"),
                root.path("needsFollowUp").asBoolean(false),
                arrayText(root.path("followUpQuestions"), 3)
        );
    }

    private String extractorText(JsonNode node, String field) {
        return aiJsonExtractor.text(node, field);
    }

    private String fallback(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private List<String> arrayText(JsonNode node, int max) {
        List<String> result = new ArrayList<>();
        if (!node.isArray()) {
            return result;
        }
        for (JsonNode item : node) {
            if (item.isTextual() && !item.asText().isBlank()) {
                result.add(item.asText().trim());
                if (result.size() >= max) {
                    break;
                }
            }
        }
        return result;
    }
}
