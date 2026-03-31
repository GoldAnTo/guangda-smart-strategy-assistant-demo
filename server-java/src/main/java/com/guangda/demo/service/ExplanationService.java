package com.guangda.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.ExplainRequest;
import com.guangda.demo.dto.ExplanationResponse;
import com.guangda.demo.prompt.AiPromptTemplates;
import org.springframework.stereotype.Service;

@Service
public class ExplanationService {

    private final AiClientService aiClientService;
    private final ObjectMapper objectMapper;
    private final ComplianceService complianceService;
    private final AiJsonExtractor aiJsonExtractor;

    public ExplanationService(AiClientService aiClientService,
                              ObjectMapper objectMapper,
                              ComplianceService complianceService,
                              AiJsonExtractor aiJsonExtractor) {
        this.aiClientService = aiClientService;
        this.objectMapper = objectMapper;
        this.complianceService = complianceService;
        this.aiJsonExtractor = aiJsonExtractor;
    }

    public ExplanationResponse generate(ExplainRequest request) {
        String prompt = buildExplanationPrompt(request);
        JsonNode root = aiClientService.generateJson(prompt, "You must output valid JSON only. Do not include markdown fences or extra commentary.", 0.2);
        return complianceService.cleanExplanation(root, aiJsonExtractor);
    }

    private String buildExplanationPrompt(ExplainRequest request) {
        try {
            String profile = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request.profile());
            String recommended = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request.recommended());
            String excluded = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request.excluded() == null ? java.util.List.of() : request.excluded());
            return "你是“光大资管智能策略推荐助手”中的客户参考说明模块。\n\n" +
                    "你的任务不是做正式投资建议，而是基于已给定的客户画像、候选方向和未推荐方向，生成一份客户能看懂、语气克制、边界清晰的参考说明。\n\n" +
                    "你必须严格输出 JSON，不得输出任何额外文字、标题或 markdown。\n\n" +
                    "输出字段固定为：\n- summary\n- clientExplanation\n- internalNotes\n- riskNotice\n- whyNot\n\n" +
                    "字段要求如下：\n" +
                    "1. summary：一句话概括当前更适合优先关注的方向，语气必须克制\n" +
                    "2. clientExplanation：面向客户，说明为什么当前方向更贴近其需求\n" +
                    "3. internalNotes：面向客户经理，写清客户标签、沟通重点、推荐顺序、风险提醒\n" +
                    "4. riskNotice：必须保留风险提示，且不能弱化风险\n" +
                    "5. whyNot：字符串数组，最多 3 条，说明当前暂不优先某些方向的原因\n\n" +
                    "合规与风格规则：\n" +
                    "- 不得使用“保本、稳赚、确定收益、不会亏、几乎没风险”等表达\n" +
                    "- 不得承诺收益\n" +
                    "- 不得写成最终投资建议\n" +
                    "- clientExplanation 要像顾问在解释，不像系统在打分\n" +
                    "- 可以使用“更适合优先关注”“可以作为参考方向”“还需要结合具体情况进一步判断”等表达\n" +
                    "- 不要输出超出已给定候选范围的新推荐结论\n" +
                    "- 如果基准、收益率、回撤等字段属于演示结构，不要把它们表达成正式真实业绩\n\n" +
                    "客户画像：\n" + profile + "\n\n候选方向：\n" + recommended + "\n\n当前不优先方向：\n" + excluded;
        } catch (Exception e) {
            return "客户画像：{}\n候选方向：[]\n当前不优先方向：[]";
        }
    }
}
