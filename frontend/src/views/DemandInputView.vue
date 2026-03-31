<template>
  <div class="page-shell demand-page customer-demand">
    <section class="demand-hero glass-card">
      <div>
        <div class="section-eyebrow">Preference profile</div>
        <h1>先了解一下你的投资偏好</h1>
        <p class="page-lead">只需要几项关键信息，我们就能先帮你梳理更贴近当前需求的配置方向。这里更像一次偏好了解，而不是复杂表单。</p>
      </div>
      <div class="hero-side">
        <div class="hero-tip">更看重稳一点，还是希望多一点收益弹性？</div>
        <div class="hero-tip">这笔钱近期会不会用到？</div>
      </div>
    </section>

    <div class="page-body">
      <div class="left-panel">
        <DemandForm v-model="form" @submit="handleAnalyze" @reset="handleReset" />

        <el-card v-if="profile?.needsFollowUp" class="follow-up-card">
          <template #header><span>还想再确认你几件事</span></template>
          <ul class="follow-up-list">
            <li v-for="question in profile.followUpQuestions" :key="question">{{ question }}</li>
          </ul>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card>
          <template #header><span>示例偏好场景</span></template>
          <div class="scenario-list">
            <button v-for="scene in scenarios" :key="scene.id" class="scenario-btn" @click="handleApplyScenario(scene)">
              <strong>{{ scene.title }}</strong>
              <span>{{ scene.description || '点一下，先看看这种偏好会得到什么参考方向' }}</span>
            </button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DemandForm from '../components/DemandForm.vue'
import { useDemandStore } from '../stores/demand'
import { useRecommendationStore } from '../stores/recommendation'
import { analyzeDemand } from '../services/demand'
import scenarios from '../mock/scenarios.json'

const router = useRouter()
const demandStore = useDemandStore()
const recommendationStore = useRecommendationStore()

const form = computed({
  get: () => demandStore.form,
  set: (value) => demandStore.setForm(value)
})

const profile = computed(() => demandStore.profile)

async function handleAnalyze() {
  recommendationStore.resetRecommendation()
  const result = await analyzeDemand(demandStore.form)
  demandStore.setProfile(result.profile)
  if (!result.profile.needsFollowUp) router.push('/recommendation')
}

function handleReset() {
  demandStore.resetDemand()
  recommendationStore.resetRecommendation()
}

function handleApplyScenario(scene: any) {
  demandStore.setForm(scene.input)
}
</script>

<style scoped>
.customer-demand {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demand-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: center;
  padding: 20px 20px;
}

.demand-hero h1 {
  margin: 10px 0 8px;
  font-size: 34px;
}

.hero-side {
  display: grid;
  gap: 12px;
}

.hero-tip {
  padding: 16px;
  border-radius: 18px;
  background: rgba(23, 55, 91, 0.06);
  color: var(--muted);
  line-height: 1.8;
}

.page-body {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) 360px;
  gap: 20px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.follow-up-card {
  background: rgba(229, 163, 71, 0.1);
}

.follow-up-list {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.8;
}

.scenario-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scenario-btn {
  padding: 16px;
  text-align: left;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.scenario-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(25, 50, 74, 0.08);
}

.scenario-btn strong {
  display: block;
  margin-bottom: 6px;
  color: var(--blue);
}

.scenario-btn span {
  color: var(--muted);
  line-height: 1.7;
}

@media (max-width: 1180px) {
  .demand-hero,
  .page-body {
    grid-template-columns: 1fr;
  }
}
</style>
