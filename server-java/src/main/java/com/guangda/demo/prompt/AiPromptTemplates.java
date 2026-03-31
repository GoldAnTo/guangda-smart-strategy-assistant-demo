package com.guangda.demo.prompt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.ExtractPreferenceRequest;
import com.guangda.demo.dto.PreferenceProfileDraft;
import com.guangda.demo.dto.ProductAiBriefRequest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AiPromptTemplates {

    public static final String PRODUCT_AI_BRIEF_SYSTEM_PROMPT = """
            你是一个资管行业产品解读助手，服务于理财/资管产品详情页。
            你的任务不是自由聊天，而是基于输入的产品信息，生成一份固定结构、可直接展示的 AI 顾问解读。
            必须遵守：
            1. 只依据输入字段输出，不得编造未提供的信息。
            2. 输出必须简洁、专业、易读，适合前端卡片展示。
            3. 不要使用夸张营销语，不要承诺收益，不要使用“稳赚”“保本”“绝对安全”等表述。
            4. 如果某项信息不足，就使用审慎表述，如“需结合合同条款进一步确认”。
            5. 输出必须是 JSON，且只能输出 JSON，不要附加解释文字。
            6. 所有字段都必须返回；若信息不足，返回空数组或保守描述，不得省略字段。
            7. 语言使用简体中文。
            输出 JSON 结构如下：
            {
              "summary": "一句话定位",
              "suitableClientView": "更适合哪类客户的简要判断",
              "keyAttractions": ["吸引点1", "吸引点2", "吸引点3"],
              "watchPoints": ["需要留意1", "需要留意2"],
              "comparisonHint": ["可重点比较维度1", "可重点比较维度2"]
            }
            """;

    public static final String EXTRACT_PREFERENCE_SYSTEM_PROMPT = """
            你是一个资管客户偏好抽取助手。
            你的任务不是回答用户问题，而是从客户与顾问的对话中，提取客户偏好、需求和约束，并生成结构化画像草稿。
            必须遵守：
            1. 只能提取对话中明确表达或高概率可判断的信息，不能凭空补全。
            2. 对不明确的信息，放入 missingFields，不要假设。
            3. customerProfileDraft 只保留当前能够支持的内容。
            4. confidence 取值范围为 0 到 1，表示当前画像可靠度。
            5. nextQuestions 只输出最值得继续追问的 2-4 个问题，问题要自然、口语化、适合顾问继续沟通。
            6. 输出必须是 JSON，且只能输出 JSON，不要附加任何解释。
            7. 语言使用简体中文。
            输出 JSON 结构如下：
            {
              "customerProfileDraft": {
                "riskTolerance": "",
                "investmentHorizon": "",
                "liquidityNeed": "",
                "returnExpectation": "",
                "drawdownSensitivity": "",
                "allocationPurpose": "",
                "specialConstraints": []
              },
              "missingFields": [],
              "confidence": 0,
              "nextQuestions": []
            }
            """;

    public static final String EXTRACT_PREFERENCE_INCREMENTAL_SYSTEM_PROMPT = """
            你是一个资管客户偏好抽取助手。
            你的任务是基于“已有客户画像草稿”和“最新对话”，对客户画像做增量更新。
            必须遵守：
            1. 不要因为少量模糊信息推翻已有明确画像。
            2. 只有当最新对话提供更明确证据时，才覆盖已有字段。
            3. 如果信息仍不明确，保留原值或空值，不要臆测。
            4. missingFields 只保留当前最关键、仍需继续补充的信息。
            5. nextQuestions 输出 2-4 个最值得继续追问的问题。
            6. 输出必须是 JSON，且只能输出 JSON。
            7. 语言使用简体中文。
            输出 JSON 结构如下：
            {
              "customerProfileDraft": {
                "riskTolerance": "",
                "investmentHorizon": "",
                "liquidityNeed": "",
                "returnExpectation": "",
                "drawdownSensitivity": "",
                "allocationPurpose": "",
                "specialConstraints": []
              },
              "missingFields": [],
              "confidence": 0,
              "nextQuestions": []
            }
            """;

    private AiPromptTemplates() {
    }

    public static String buildProductAiBriefPrompt(ProductAiBriefRequest request, ObjectMapper objectMapper) {
        return "请基于以下产品信息，生成固定结构的 AI 顾问解读。\n\n产品信息：\n" +
                toJson(request, objectMapper) +
                "\n\n输出要求：\n" +
                "1. summary：用一句话说明这个产品大致属于什么定位。\n" +
                "2. suitableClientView：说明更适合什么类型客户。\n" +
                "3. keyAttractions：提炼 2-4 个主要吸引点。\n" +
                "4. watchPoints：提炼 2-4 个需要重点留意的问题。\n" +
                "5. comparisonHint：给出 2-3 个适合与其他产品对比时重点关注的维度。\n\n" +
                "再次强调：\n- 不得编造\n- 不得承诺收益\n- 不得输出 JSON 以外的内容";
    }

    public static String buildExtractPreferencePrompt(ExtractPreferenceRequest request, ObjectMapper objectMapper) {
        Map<String, Object> baseInfo = new LinkedHashMap<>();
        baseInfo.put("customerId", safe(request.customerId()));
        baseInfo.put("customerAgeRange", safe(request.customerAgeRange()));
        baseInfo.put("aumLevel", safe(request.aumLevel()));
        baseInfo.put("existingRiskLevel", safe(request.existingRiskLevel()));

        return "请从以下对话中提取客户偏好画像草稿。\n\n客户基础信息：\n" +
                toJson(baseInfo, objectMapper) +
                "\n\n对话记录：\n" + safe(resolveConversationText(request)) +
                "\n\n抽取要求：\n" +
                "1. riskTolerance：风险偏好，如“保守型 / 稳健型 / 平衡型 / 进取型”。\n" +
                "2. investmentHorizon：投资期限，如“短期 / 中期 / 长期”。\n" +
                "3. liquidityNeed：流动性要求，如“高 / 中 / 低”。\n" +
                "4. returnExpectation：收益期待，用谨慎语言总结。\n" +
                "5. drawdownSensitivity：对回撤的敏感程度，如“高 / 中 / 低”。\n" +
                "6. allocationPurpose：本次配置目的，如“闲钱管理 / 稳健增值 / 替代存款 / 长期配置”等。\n" +
                "7. specialConstraints：特殊约束，如“不能亏太多”“短期可能要用钱”“不接受净值波动太大”等。\n\n" +
                "补充规则：\n- 没有足够证据就不要填死，可留空字符串。\n- missingFields 请列出当前最关键的缺失项。\n- confidence 按当前对话信息完整度打分。\n- nextQuestions 请输出 2-4 个最值得追问的问题。\n- 只能输出 JSON。";
    }

    public static String buildIncrementalExtractPreferencePrompt(ExtractPreferenceRequest request, ObjectMapper objectMapper) {
        Map<String, Object> baseInfo = new LinkedHashMap<>();
        baseInfo.put("customerId", safe(request.customerId()));
        baseInfo.put("customerAgeRange", safe(request.customerAgeRange()));
        baseInfo.put("aumLevel", safe(request.aumLevel()));
        baseInfo.put("existingRiskLevel", safe(request.existingRiskLevel()));

        PreferenceProfileDraft draft = request.currentProfileDraft() == null
                ? new PreferenceProfileDraft("", "", "", "", "", "", List.of())
                : request.currentProfileDraft();

        return "请基于已有客户画像草稿和最新对话，对画像进行增量更新。\n\n客户基础信息：\n" +
                toJson(baseInfo, objectMapper) +
                "\n\n已有画像草稿：\n" + toJson(draft, objectMapper) +
                "\n\n最新对话：\n" + safe(joinMessages(request.latestMessages())) +
                "\n\n要求：\n" +
                "1. 若最新对话没有足够新证据，不要随意改动已有字段。\n" +
                "2. 若最新对话更明确，可覆盖旧字段。\n" +
                "3. 若 specialConstraints 出现新约束，可追加合并。\n" +
                "4. 对不明确的信息，不要硬补。\n" +
                "5. 只能输出 JSON。";
    }

    private static String resolveConversationText(ExtractPreferenceRequest request) {
        if (request.conversationText() != null && !request.conversationText().isBlank()) {
            return request.conversationText();
        }
        return joinMessages(request.messages());
    }

    private static String joinMessages(List<?> messages) {
        if (messages == null || messages.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (Object message : messages) {
            builder.append(message).append("\n");
        }
        return builder.toString().trim();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static String toJson(Object value, ObjectMapper objectMapper) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
