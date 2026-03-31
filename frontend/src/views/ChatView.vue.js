import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AiChatPanel from '../components/AiChatPanel.vue';
import { useDemandStore } from '../stores/demand';
import { useRecommendationStore } from '../stores/recommendation';
import { useChatStore } from '../stores/chat';
import { sendChat } from '../services/chat';
const router = useRouter();
const demandStore = useDemandStore();
const recommendationStore = useRecommendationStore();
const chatStore = useChatStore();
const profile = computed(() => demandStore.profile);
const quickQuestions = [
    '为什么推荐固收+，而不是纯债？',
    '这个方案的风险在哪里？',
    '适合什么类型客户？',
    '如果客户更保守，怎么调整？'
];
async function handleSend(question) {
    chatStore.addUserMessage(question);
    const result = await sendChat({
        question,
        context: {
            profile: demandStore.profile,
            recommended: recommendationStore.recommended,
            riskNotice: recommendationStore.explanation?.riskNotice || ''
        }
    });
    chatStore.addAssistantMessage(result.answer);
    chatStore.setEscalation(result.shouldEscalate);
}
async function handleQuickAsk(question) {
    await handleSend(question);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
if (!__VLS_ctx.profile || !__VLS_ctx.recommendationStore.recommended.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    const __VLS_0 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        description: "暂无推荐结果，请先完成需求分析和匹配。",
    }));
    const __VLS_2 = __VLS_1({
        description: "暂无推荐结果，请先完成需求分析和匹配。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const __VLS_4 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onClick: (...[$event]) => {
            if (!(!__VLS_ctx.profile || !__VLS_ctx.recommendationStore.recommended.length))
                return;
            __VLS_ctx.router.push('/demand');
        }
    };
    __VLS_7.slots.default;
    var __VLS_7;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chat-layout" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sidebar" },
    });
    const __VLS_12 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    {
        const { header: __VLS_thisSlot } = __VLS_15.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    (__VLS_ctx.profile.riskLevel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    (__VLS_ctx.profile.horizonTag);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    (__VLS_ctx.profile.liquidityTag);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    (__VLS_ctx.profile.goalTag);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.recommendationStore.recommended))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (item.productId),
        });
        (item.productName);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.recommendationStore.explanation?.riskNotice);
    var __VLS_15;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "main-panel" },
    });
    /** @type {[typeof AiChatPanel, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(AiChatPanel, new AiChatPanel({
        ...{ 'onSend': {} },
        ...{ 'onQuickAsk': {} },
        messages: (__VLS_ctx.chatStore.messages),
        shouldEscalate: (__VLS_ctx.chatStore.shouldEscalate),
        quickQuestions: (__VLS_ctx.quickQuestions),
    }));
    const __VLS_17 = __VLS_16({
        ...{ 'onSend': {} },
        ...{ 'onQuickAsk': {} },
        messages: (__VLS_ctx.chatStore.messages),
        shouldEscalate: (__VLS_ctx.chatStore.shouldEscalate),
        quickQuestions: (__VLS_ctx.quickQuestions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    let __VLS_19;
    let __VLS_20;
    let __VLS_21;
    const __VLS_22 = {
        onSend: (__VLS_ctx.handleSend)
    };
    const __VLS_23 = {
        onQuickAsk: (__VLS_ctx.handleQuickAsk)
    };
    var __VLS_18;
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['main-panel']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AiChatPanel: AiChatPanel,
            router: router,
            recommendationStore: recommendationStore,
            chatStore: chatStore,
            profile: profile,
            quickQuestions: quickQuestions,
            handleSend: handleSend,
            handleQuickAsk: handleQuickAsk,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
