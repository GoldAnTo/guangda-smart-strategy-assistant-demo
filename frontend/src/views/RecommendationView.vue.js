import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CustomerProfileCard from '../components/CustomerProfileCard.vue';
import RecommendationCard from '../components/RecommendationCard.vue';
import { useDemandStore } from '../stores/demand';
import { useRecommendationStore } from '../stores/recommendation';
import { matchProducts, generateExplanation } from '../services/recommendation';
const router = useRouter();
const demandStore = useDemandStore();
const recommendationStore = useRecommendationStore();
const profile = computed(() => demandStore.profile);
onMounted(async () => {
    if (!demandStore.profile)
        return;
    const matchResult = await matchProducts(demandStore.profile);
    recommendationStore.setMatchResult(matchResult);
    if (matchResult.shouldEscalate)
        return;
    const explanation = await generateExplanation({
        profile: demandStore.profile,
        recommended: matchResult.recommended,
        excluded: matchResult.excluded
    });
    recommendationStore.setExplanation(explanation);
});
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
if (!__VLS_ctx.profile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
    const __VLS_0 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        description: "暂无客户画像，请先返回需求页完成分析。",
    }));
    const __VLS_2 = __VLS_1({
        description: "暂无客户画像，请先返回需求页完成分析。",
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
            if (!(!__VLS_ctx.profile))
                return;
            __VLS_ctx.router.push('/demand');
        }
    };
    __VLS_7.slots.default;
    var __VLS_7;
}
else {
    /** @type {[typeof CustomerProfileCard, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(CustomerProfileCard, new CustomerProfileCard({
        profile: (__VLS_ctx.profile),
    }));
    const __VLS_13 = __VLS_12({
        profile: (__VLS_ctx.profile),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    if (__VLS_ctx.recommendationStore.shouldEscalate) {
        const __VLS_15 = {}.ElAlert;
        /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
            ...{ class: "mt-4" },
            type: "warning",
            title: (__VLS_ctx.recommendationStore.escalationReason || '建议转人工处理'),
            closable: (false),
        }));
        const __VLS_17 = __VLS_16({
            ...{ class: "mt-4" },
            type: "warning",
            title: (__VLS_ctx.recommendationStore.escalationReason || '建议转人工处理'),
            closable: (false),
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "content-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "left-panel" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.recommendationStore.recommended))) {
            /** @type {[typeof RecommendationCard, ]} */ ;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent(RecommendationCard, new RecommendationCard({
                key: (item.productId),
                item: (item),
                riskNotice: (__VLS_ctx.recommendationStore.explanation?.riskNotice),
            }));
            const __VLS_20 = __VLS_19({
                key: (item.productId),
                item: (item),
                riskNotice: (__VLS_ctx.recommendationStore.explanation?.riskNotice),
            }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "right-panel" },
        });
        const __VLS_22 = {}.ElCard;
        /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({}));
        const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
        __VLS_25.slots.default;
        {
            const { header: __VLS_thisSlot } = __VLS_25.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-bar" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.recommendationStore.explanation?.summary);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.recommendationStore.explanation?.clientExplanation);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.recommendationStore.explanation?.internalNotes);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section risk-box" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.recommendationStore.explanation?.riskNotice);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "history-tip" },
        });
        if (__VLS_ctx.recommendationStore.explanation?.whyNot?.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "section-title" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.recommendationStore.explanation?.whyNot))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: (item),
                });
                (item);
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "actions" },
        });
        const __VLS_26 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_28 = __VLS_27({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        let __VLS_30;
        let __VLS_31;
        let __VLS_32;
        const __VLS_33 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.profile))
                    return;
                if (!!(__VLS_ctx.recommendationStore.shouldEscalate))
                    return;
                __VLS_ctx.router.push('/chat');
            }
        };
        __VLS_29.slots.default;
        var __VLS_29;
        const __VLS_34 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
            ...{ 'onClick': {} },
        }));
        const __VLS_36 = __VLS_35({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_35));
        let __VLS_38;
        let __VLS_39;
        let __VLS_40;
        const __VLS_41 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.profile))
                    return;
                if (!!(__VLS_ctx.recommendationStore.shouldEscalate))
                    return;
                __VLS_ctx.router.push('/demand');
            }
        };
        __VLS_37.slots.default;
        var __VLS_37;
        var __VLS_25;
    }
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['left-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['right-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['risk-box']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['history-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CustomerProfileCard: CustomerProfileCard,
            RecommendationCard: RecommendationCard,
            router: router,
            recommendationStore: recommendationStore,
            profile: profile,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
