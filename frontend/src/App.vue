<template>
  <div class="app-shell">
    <div class="app-bg app-bg-one"></div>
    <div class="app-bg app-bg-two"></div>
    <div class="app-bg app-bg-grid"></div>

    <!-- 合规免责横幅 -->
    <div class="compliance-banner">
      <span class="cb-icon">⚠️</span>
      <span class="cb-text"><strong>免责声明：</strong>本平台所有策略数据均为演示用模拟数据，不构成光大资管任何产品的真实业绩陈述或投资建议。投资有风险，决策需谨慎。</span>
    </div>

    <header class="topbar">
      <div class="brand" @click="router.push('/')">
        <div class="brand-mark">GS</div>
        <div>
          <div class="brand-title">光大资管策略顾问台</div>
          <div class="brand-subtitle">Private Wealth Product Experience</div>
        </div>
      </div>

      <nav class="topnav">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="nav-btn"
          :class="{ active: route.path === item.path }"
          @click="router.push(item.path)"
        >
          {{ item.label }}
        </button>
      </nav>
    </header>

    <main class="view-wrap">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = computed(() => [
  { path: '/', label: '策略首页' },
  { path: '/advisor', label: 'AI顾问台' },
  { path: '/compare', label: '产品线诊断' },
  { path: '/exhibition', label: '大屏展厅' },
  { path: '/recommendation', label: '组合配置' }
])
</script>

<style>
:root {
  --bg: #f5efe5;
  --bg-soft: rgba(255, 250, 242, 0.74);
  --panel: rgba(255, 252, 246, 0.84);
  --panel-strong: rgba(14, 41, 67, 0.92);
  --line: rgba(31, 55, 78, 0.12);
  --line-strong: rgba(31, 55, 78, 0.2);
  --text: #19324a;
  --muted: #6d7c8d;
  --gold: #9e722e;
  --gold-soft: #efe0bc;
  --blue: #17375b;
  --blue-soft: #dbe8f3;
  --danger-soft: #f8e7da;
  --cyan: #58c7ff;
  --orange: #ff9b5b;
  --gold: #ffbd63;
  --danger: #ff6b7f;
  --line: rgba(31, 55, 78, 0.12);
  --shadow-lg: 0 30px 90px rgba(41, 61, 84, 0.12);
  --shadow-md: 0 16px 48px rgba(41, 61, 84, 0.1);
  --radius-xl: 30px;
  --radius-lg: 22px;
  --radius-md: 16px;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(215, 183, 120, 0.2), transparent 34%),
    linear-gradient(180deg, #f8f2e9 0%, #f4ede2 48%, #efe6da 100%);
  color: var(--text);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

body {
  min-height: 100vh;
}

* {
  box-sizing: border-box;
}

a {
  color: inherit;
}

button {
  font: inherit;
}

.app-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.app-bg {
  position: fixed;
  inset: auto;
  border-radius: 999px;
  pointer-events: none;
}

.app-bg-one {
  top: -120px;
  right: -80px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(167, 123, 50, 0.28), rgba(167, 123, 50, 0));
  filter: blur(8px);
  opacity: 0.8;
}

.app-bg-two {
  bottom: -160px;
  left: -80px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(23, 55, 91, 0.16), rgba(23, 55, 91, 0));
  filter: blur(6px);
  opacity: 0.8;
}

.app-bg-grid {
  inset: 0;
  background-image: linear-gradient(rgba(23, 55, 91, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(23, 55, 91, 0.03) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.4), transparent 72%);
}

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 14px 28px;
  height: 72px;
  background: rgba(248, 242, 233, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(25, 50, 74, 0.1);
  box-shadow: 0 2px 24px rgba(41, 61, 84, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #18385c, #2d567f);
  color: #fff7ea;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.brand-subtitle {
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topnav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.nav-btn {
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--muted);
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover,
.nav-btn.active {
  color: var(--blue);
  border-color: rgba(23, 55, 91, 0.12);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 24px rgba(25, 50, 74, 0.08);
}

.view-wrap {
  position: relative;
  padding: 88px 24px 40px;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-shell {
  max-width: 1440px;
  margin: 0 auto;
}

.glass-card,
.el-card {
  background: var(--panel);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
}

.el-card__header {
  border-bottom-color: var(--line);
}

.page-lead {
  color: var(--muted);
  line-height: 1.85;
}

.section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--gold);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-eyebrow::before {
  content: '';
  width: 28px;
  height: 1px;
  background: rgba(158, 114, 46, 0.5);
}

@media (max-width: 960px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topnav {
    justify-content: flex-start;
  }

  .view-wrap {
    padding: 88px 16px 40px;
  }
}


/* 合规免责横幅 */
.compliance-banner {
  position: relative;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 28px;
  background: rgba(249, 115, 22, 0.09);
  border-bottom: 1.5px solid rgba(249, 115, 22, 0.22);
}
.cb-icon { font-size: 15px; flex-shrink: 0; }
.cb-text { font-size: 11.5px; color: #92400e; line-height: 1.6; }
.cb-text strong { font-weight: 700; }

</style>
