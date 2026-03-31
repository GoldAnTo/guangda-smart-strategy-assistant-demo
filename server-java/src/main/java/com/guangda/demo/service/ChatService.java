package com.guangda.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guangda.demo.dto.ChatRequest;
import com.guangda.demo.dto.ChatResponse;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private static final String CHAT_SYSTEM_PROMPT = """
            你是一名资管产品与策略沟通助手。
            你必须始终遵守以下规则：
            - 你不是最终投顾决策人
            - 你不能承诺收益或保本
            - 你不能使用绝对化、误导性或过度营销的话术
            - 你只能围绕给定上下文中的产品、策略、客户偏好与风险提示回答
            - 如果信息不足，你优先补问，而不是强行下结论
            - 如果问题涉及正式销售判断、敏感争议或超出上下文，明确提示建议进一步人工沟通确认
            你的回答风格：
            - 专业但通俗
            - 简洁、克制、自然
            - 先解释，再给方向
            - 不要堆术语，不要写成官话或营销文案
            """;

    private final AiClientService aiClientService;
    private final ComplianceService complianceService;
    private final RuleService ruleService;
    private final ObjectMapper objectMapper;

    public ChatService(AiClientService aiClientService,
                       ComplianceService complianceService,
                       RuleService ruleService,
                       ObjectMapper objectMapper) {
        this.aiClientService = aiClientService;
        this.complianceService = complianceService;
        this.ruleService = ruleService;
        this.objectMapper = objectMapper;
    }

    public ChatResponse chat(ChatRequest request) {
        if (ruleService.checkChatEscalation(request.question())) {
            return new ChatResponse("这个问题涉及更具体的正式推荐或敏感判断，建议由客户经理进一步确认后沟通。", true, true);
        }
        String prompt = buildChatPrompt(request);
        String raw = aiClientService.generateText(prompt, CHAT_SYSTEM_PROMPT, 0.2);
        return complianceService.cleanChatAnswer(raw, false);
    }

    private String buildChatPrompt(ChatRequest request) {
        try {
            String context = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request.context());
            return "你是“光大资管智能策略推荐助手”中的客户沟通助手。\n\n" +
                    "你的角色不是万能聊天机器人，而是一个“产品与策略介绍 + 偏好引导 + 初步参考说明”的顾问型助手。\n\n" +
                    "你的职责：\n" +
                    "- 解释某个策略/产品方向是什么\n" +
                    "- 解释不同方向之间的差异\n" +
                    "- 根据客户已提供的信息，帮助客户理解什么方向更值得先看\n" +
                    "- 如果客户信息不足，则继续补问最关键的1-2个问题\n" +
                    "- 在边界敏感时，明确提示这只是初步沟通参考，建议进一步人工确认\n\n" +
                    "你的回答规则：\n" +
                    "- 先解释，再给方向\n" +
                    "- 专业但通俗，不要堆术语\n" +
                    "- 克制，不夸张，不营销腔，不装懂\n" +
                    "- 不得新增上下文中不存在的产品或策略\n" +
                    "- 不得承诺收益\n" +
                    "- 不得弱化风险\n" +
                    "- 不得输出“保本、稳赚、确定收益、不会亏、几乎没风险”等表述\n" +
                    "- 不得把演示数据说成正式真实业绩\n\n" +
                    "当前上下文：\n" + context + "\n\n客户追问：\n" + request.question();
        } catch (Exception e) {
            return "当前上下文：{}\n\n客户追问：\n" + request.question();
        }
    }
}
