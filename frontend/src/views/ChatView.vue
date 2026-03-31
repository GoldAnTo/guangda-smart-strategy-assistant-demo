<template>
  <div class="page-shell chat-page">
    <section class="chat-hero glass-card">
      <div>
        <div class="section-eyebrow">Guided conversation</div>
        <h1>{{ heroTitle }}</h1>
        <p class="page-lead">{{ heroLead }}</p>
      </div>
      <div class="hero-note">{{ heroNote }}</div>
    </section>

    <section class="chat-ai-band" v-if="preferenceDraft || preferenceLoading">
      <div class="chat-ai-band-head">
        <div>
          <div class="section-eyebrow">Preference Engine</div>
          <h2>AI 已识别偏好</h2>
        </div>
        <div class="hero-band-note">{{ preferenceLoading ? '画像正在更新' : `可信度 ${Math.round((preferenceDraft?.confidence || 0) * 100)}%` }}</div>
      </div>

      <div v-if="preferenceLoading" class="hero-band-loading">AI 正在根据你刚才的表达更新客户画像...</div>

      <template v-else-if="preferenceDraft">
        <div class="hero-band-grid">
          <div class="hero-band-card" v-if="preferenceDraft.customerProfileDraft.riskTolerance">
            <span>风险偏好</span>
            <strong>{{ preferenceDraft.customerProfileDraft.riskTolerance }}</strong>
          </div>
          <div class="hero-band-card" v-if="preferenceDraft.customerProfileDraft.investmentHorizon">
            <span>投资期限</span>
            <strong>{{ preferenceDraft.customerProfileDraft.investmentHorizon }}</strong>
          </div>
          <div class="hero-band-card" v-if="preferenceDraft.customerProfileDraft.liquidityNeed">
            <span>流动性要求</span>
            <strong>{{ preferenceDraft.customerProfileDraft.liquidityNeed }}</strong>
          </div>
          <div class="hero-band-card wide-card" v-if="preferenceDraft.customerProfileDraft.returnExpectation">
            <span>收益期待</span>
            <strong>{{ preferenceDraft.customerProfileDraft.returnExpectation }}</strong>
          </div>
          <div class="hero-band-card" v-if="preferenceDraft.customerProfileDraft.drawdownSensitivity">
            <span>回撤敏感度</span>
            <strong>{{ preferenceDraft.customerProfileDraft.drawdownSensitivity }}</strong>
          </div>
          <div class="hero-band-card wide-card" v-if="preferenceDraft.customerProfileDraft.allocationPurpose">
            <span>配置目的</span>
            <strong>{{ preferenceDraft.customerProfileDraft.allocationPurpose }}</strong>
          </div>
        </div>

        <div class="hero-band-columns">
          <div class="hero-band-panel" v-if="preferenceDraft.customerProfileDraft.specialConstraints.length">
            <div class="hero-panel-title">特殊约束</div>
            <ul>
              <li v-for="item in preferenceDraft.customerProfileDraft.specialConstraints" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="hero-band-panel" v-if="preferenceDraft.missingFields.length">
            <div class="hero-panel-title">仍需补充</div>
            <ul>
              <li v-for="item in preferenceDraft.missingFields" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="hero-band-panel accent-panel" v-if="preferenceDraft.nextQuestions.length">
            <div class="hero-panel-title">建议下一问</div>
            <ul>
              <li v-for="item in preferenceDraft.nextQuestions" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </template>
    </section>

    <div class="chat-layout single-mode">
      <div class="sidebar">
        <el-card class="sidebar-card">
          <template #header><span>{{ sideTitle }}</span></template>

          <div v-if="selectedStrategy" class="summary-group intro-card">
            <div class="summary-title">当前正在了解</div>
            <p class="lead-name">{{ selectedStrategy.name }}</p>
            <p>{{ selectedStrategy.strategy }}</p>
          </div>

          <div v-if="selectedStrategy" class="summary-group">
            <div class="summary-title">通常更适合</div>
            <ul>
              <li v-for="item in selectedStrategy.suitableFor" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div v-if="selectedStrategy" class="summary-group warning">
            <div class="summary-title">需要留意</div>
            <p>{{ selectedStrategy.standardRiskNotice }}</p>
          </div>

          <div v-if="preferenceLoading" class="summary-group intro-card">
            <div class="summary-title">AI 已识别偏好</div>
            <p>正在根据最新对话更新画像...</p>
          </div>

          <div v-else-if="preferenceDraft" class="summary-group intro-card ai-profile-card">
            <div class="summary-title">AI 已识别偏好</div>
            <ul class="profile-list">
              <li v-if="preferenceDraft.customerProfileDraft.riskTolerance"><span>风险偏好</span><strong>{{ preferenceDraft.customerProfileDraft.riskTolerance }}</strong></li>
              <li v-if="preferenceDraft.customerProfileDraft.investmentHorizon"><span>投资期限</span><strong>{{ preferenceDraft.customerProfileDraft.investmentHorizon }}</strong></li>
              <li v-if="preferenceDraft.customerProfileDraft.liquidityNeed"><span>流动性要求</span><strong>{{ preferenceDraft.customerProfileDraft.liquidityNeed }}</strong></li>
              <li v-if="preferenceDraft.customerProfileDraft.returnExpectation"><span>收益期待</span><strong>{{ preferenceDraft.customerProfileDraft.returnExpectation }}</strong></li>
              <li v-if="preferenceDraft.customerProfileDraft.drawdownSensitivity"><span>回撤敏感度</span><strong>{{ preferenceDraft.customerProfileDraft.drawdownSensitivity }}</strong></li>
              <li v-if="preferenceDraft.customerProfileDraft.allocationPurpose"><span>配置目的</span><strong>{{ preferenceDraft.customerProfileDraft.allocationPurpose }}</strong></li>
            </ul>
            <div v-if="preferenceDraft.customerProfileDraft.specialConstraints.length" class="summary-group nested-group">
              <div class="summary-title minor-title">特殊约束</div>
              <ul>
                <li v-for="item in preferenceDraft.customerProfileDraft.specialConstraints" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div v-if="preferenceDraft.missingFields.length" class="summary-group nested-group">
              <div class="summary-title minor-title">仍需补充</div>
              <ul>
                <li v-for="item in preferenceDraft.missingFields" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div v-if="preferenceDraft.nextQuestions.length" class="summary-group nested-group">
              <div class="summary-title minor-title">建议下一问</div>
              <ul>
                <li v-for="item in preferenceDraft.nextQuestions" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>

          <template v-else-if="profile && recommendationStore.recommended.length">
            <div class="summary-group intro-card">
              <div class="summary-title">当前偏好摘要</div>
              <ul>
                <li>风险等级：{{ labelOf(riskLevelLabels, profile.riskLevel) }}</li>
                <li>投资期限：{{ labelOf(horizonLabels, profile.horizonTag) }}</li>
                <li>流动性要求：{{ labelOf(liquidityLabels, profile.liquidityTag) }}</li>
                <li>收益目标：{{ labelOf(goalLabels, profile.goalTag) }}</li>
              </ul>
            </div>
            <div class="summary-group">
              <div class="summary-title">可继续了解的方向</div>
              <ul>
                <li v-for="item in recommendationStore.recommended" :key="item.productId">{{ item.productName }}</li>
              </ul>
            </div>
          </template>

          <template v-else>
            <div class="summary-group intro-card">
              <div class="summary-title">这轮对话会做什么</div>
              <p>AI 会先了解你的期限、流动性、风险偏好和收益期待，再逐步帮你缩小更值得先看的方向。</p>
            </div>
          </template>
        </el-card>
      </div>

      <div class="main-panel">
        <AiChatPanel
          :messages="chatStore.messages"
          :should-escalate="chatStore.shouldEscalate"
          :quick-questions="quickQuestions"
          :show-generate-action="showGenerateAction"
          @send="handleSend"
          @quick-ask="handleQuickAsk"
          @generate-reference="handleGenerateReference"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AiChatPanel from '../components/AiChatPanel.vue'
import { useDemandStore } from '../stores/demand'
import { useRecommendationStore } from '../stores/recommendation'
import { useChatStore } from '../stores/chat'
import { sendChat } from '../services/chat'
import { extractPreference } from '../services/ai'
import type { ExtractPreferenceResponse } from '../types/ai'
import { goalLabels, horizonLabels, labelOf, liquidityLabels, riskLevelLabels } from '../utils/labels'

const router = useRouter()
const demandStore = useDemandStore()
const recommendationStore = useRecommendationStore()
const chatStore = useChatStore()
const profile = computed(() => demandStore.profile)
const selectedStrategy = computed(() => chatStore.selectedStrategy)
const mode = computed(() => chatStore.mode)
const preferenceDraft = ref<ExtractPreferenceResponse | null>(null)
const preferenceLoading = ref(false)

const heroTitle = computed(() => {
  if (mode.value === 'strategy_intro') return '先把这个方向讲明白'
  if (mode.value === 'recommendation_followup') return '继续细化你的配置参考'
  return '先聊清楚你的偏好和资金安排'
})

const heroLead = computed(() => {
  if (mode.value === 'strategy_intro') return '先理解这个方向是什么、通常适合谁，再决定要不要继续往下聊是否贴合你。'
  if (mode.value === 'recommendation_followup') return '如果你已经有了初步方向，这里可以继续追问差异、风险和下一步怎么选。'
  return '如果你还不确定选哪个，不用急着做决定，先把期限、流动性和风险偏好聊清楚。'
})

const heroNote = computed(() => {
  if (mode.value === 'strategy_intro') return '这一步先做方向解释，不直接替你拍板。'
  if (mode.value === 'recommendation_followup') return '这一步适合继续问细节，不替代正式销售与风险确认。'
  return 'AI 会先补关键问题，再逐步缩小值得优先看的方向。'
})

const sideTitle = computed(() => {
  if (selectedStrategy.value) return '当前方向摘要'
  if (profile.value && recommendationStore.recommended.length) return '当前参考摘要'
  return '对话说明'
})

const showGenerateAction = computed(() => {
  if (chatStore.messages.length < 2) return false
  return !chatStore.shouldEscalate
})

const quickQuestions = computed(() => {
  if (mode.value === 'strategy_intro') {
    return ['这类方向通常适合什么样的人？', '和纯债/固收+相比差在哪？', '如果我半年可能要用钱，适合先了解吗？']
  }

  if (mode.value === 'recommendation_followup') {
    return ['为什么这个方向更适合我？', '如果我更保守一点，怎么调整？', '还有哪些方向值得比较？']
  }

  return ['这笔钱半年内可能要用，先看什么方向？', '我更想稳一点，但也希望比现金管理高一点，怎么选？', '如果我不想波动太大，应该先看哪类？']
})

async function handleSend(question: string) {
  chatStore.addUserMessage(question)
  const result = await sendChat({
    question,
    context: {
      mode: chatStore.mode,
      selectedStrategy: chatStore.selectedStrategy,
      profile: demandStore.profile,
      recommended: recommendationStore.recommended,
      riskNotice: recommendationStore.explanation?.riskNotice || chatStore.selectedStrategy?.standardRiskNotice || ''
    }
  })
  chatStore.addAssistantMessage(result.answer)
  chatStore.setEscalation(result.shouldEscalate)
  await updatePreferenceDraft()
}

async function handleQuickAsk(question: string) {
  await handleSend(question)
}

async function updatePreferenceDraft() {
  if (chatStore.messages.length < 2) return

  preferenceLoading.value = true
  try {
    preferenceDraft.value = await extractPreference({
      customerId: 'demo-customer-001',
      existingRiskLevel: profile.value?.riskLevel || '',
      currentProfileDraft: preferenceDraft.value?.customerProfileDraft,
      latestMessages: chatStore.messages.slice(-3).map((item) => ({
        role: item.role,
        content: item.content
      }))
    })
  } catch {
    // Keep the last successful profile snapshot when extraction fails.
  } finally {
    preferenceLoading.value = false
  }
}

function handleGenerateReference() {
  if (profile.value) {
    chatStore.setMode('recommendation_followup')
    router.push('/recommendation')
    return
  }

  router.push('/demand')
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.chat-ai-band {
  padding: 26px 28px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(17, 44, 76, 0.98), rgba(29, 72, 110, 0.94) 55%, rgba(171, 122, 47, 0.9));
  color: #fff8ef;
  box-shadow: 0 22px 40px rgba(16, 39, 68, 0.18);
}

.chat-ai-band-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.chat-ai-band-head h2 {
  margin: 10px 0 0;
  font-size: 30px;
  color: #fff8ef;
}

.hero-band-note {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.hero-band-loading {
  margin-top: 18px;
  color: rgba(255,248,239,0.82);
}

.hero-band-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.hero-band-card {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.12);
  display: grid;
  gap: 8px;
}

.hero-band-card span {
  font-size: 12px;
  color: rgba(255,248,239,0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-band-card strong {
  color: #fff8ef;
  line-height: 1.7;
}

.wide-card {
  grid-column: span 2;
}

.hero-band-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.hero-band-panel {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
}

.accent-panel {
  background: rgba(255, 236, 214, 0.16);
}

.hero-band-panel ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.9;
  color: rgba(255,248,239,0.88);
}

.hero-panel-title {
  margin-bottom: 10px;
  font-weight: 700;
  color: #fff8ef;
}

.chat-hero {
  padding: 28px 30px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.chat-hero h1 {
  margin: 12px 0 8px;
  font-size: 36px;
}

.hero-note {
  padding: 20px;
  border-radius: 20px;
  background: rgba(23, 55, 91, 0.06);
  color: var(--muted);
  line-height: 1.85;
}

.chat-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 20px;
}

.sidebar-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(247, 241, 232, 0.9));
}

.summary-group {
  margin-bottom: 18px;
}

.intro-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(23, 55, 91, 0.05);
}

.summary-title {
  margin-bottom: 8px;
  color: var(--blue);
  font-weight: 700;
}

.summary-group ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.85;
}

.ai-profile-card {
  display: grid;
  gap: 10px;
}

.profile-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.profile-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
}

.profile-list span {
  color: var(--muted);
}

.profile-list strong {
  color: var(--blue);
  text-align: right;
}

.nested-group {
  margin-bottom: 0;
}

.minor-title {
  font-size: 13px;
}

.summary-group p {
  margin: 0;
  color: var(--muted);
  line-height: 1.85;
}

.lead-name {
  color: var(--blue);
  font-weight: 700;
  margin-bottom: 6px !important;
}

.summary-group.warning {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(229, 163, 71, 0.12);
}

@media (max-width: 1180px) {
  .chat-hero,
  .chat-layout,
  .hero-band-grid,
  .hero-band-columns {
    grid-template-columns: 1fr;
  }

  .wide-card {
    grid-column: span 1;
  }
}
</style>
