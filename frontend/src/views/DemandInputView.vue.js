import { computed } from 'vue';
import { useRouter } from 'vue-router';
import DemandForm from '../components/DemandForm.vue';
import { useDemandStore } from '../stores/demand';
import { useRecommendationStore } from '../stores/recommendation';
import { analyzeDemand } from '../services/demand';
import scenarios from '../mock/scenarios.json';
const router = useRouter();
const demandStore = useDemandStore();
const recommendationStore = useRecommendationStore();
const form = computed({
    get: () => demandStore.form,
    set: (value) => demandStore.setForm(value)
});
const profile = computed(() => demandStore.profile);
async function handleAnalyze() {
    recommendationStore.resetRecommendation();
    const result = await analyzeDemand(demandStore.form);
    demandStore.setProfile(result.profile);
    if (!result.profile.needsFollowUp) {
        router.push('/recommendation');
    }
}
function handleReset() {
    demandStore.resetDemand();
    recommendationStore.resetRecommendation();
}
function handleApplyScenario(scene) {
    demandStore.setForm(scene.input);
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "left-panel" },
});
/** @type {[typeof DemandForm, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(DemandForm, new DemandForm({
    ...{ 'onSubmit': {} },
    ...{ 'onReset': {} },
    modelValue: (__VLS_ctx.form),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSubmit': {} },
    ...{ 'onReset': {} },
    modelValue: (__VLS_ctx.form),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onSubmit: (__VLS_ctx.handleAnalyze)
};
const __VLS_7 = {
    onReset: (__VLS_ctx.handleReset)
};
var __VLS_2;
if (__VLS_ctx.profile?.needsFollowUp) {
    const __VLS_8 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ class: "follow-up-card" },
    }));
    const __VLS_10 = __VLS_9({
        ...{ class: "follow-up-card" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_11.slots.default;
    {
        const { header: __VLS_thisSlot } = __VLS_11.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [question] of __VLS_getVForSourceType((__VLS_ctx.profile.followUpQuestions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (question),
        });
        (question);
    }
    var __VLS_11;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "right-panel" },
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
    ...{ class: "scenario-list" },
});
for (const [scene] of __VLS_getVForSourceType((__VLS_ctx.scenarios))) {
    const __VLS_16 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        key: (scene.id),
        ...{ class: "scenario-btn" },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        key: (scene.id),
        ...{ class: "scenario-btn" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (...[$event]) => {
            __VLS_ctx.handleApplyScenario(scene);
        }
    };
    __VLS_19.slots.default;
    (scene.title);
    var __VLS_19;
}
var __VLS_15;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-body']} */ ;
/** @type {__VLS_StyleScopedClasses['left-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['follow-up-card']} */ ;
/** @type {__VLS_StyleScopedClasses['right-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-list']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DemandForm: DemandForm,
            scenarios: scenarios,
            form: form,
            profile: profile,
            handleAnalyze: handleAnalyze,
            handleReset: handleReset,
            handleApplyScenario: handleApplyScenario,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
