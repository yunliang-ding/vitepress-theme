<template>
  <div class="aui-demo">
    <!-- 预览区：直接渲染 Vue 组件 -->
    <div class="aui-demo-preview">
      <component :is="component" />
    </div>

    <!-- 底部操作栏 -->
    <div class="aui-demo-footer">
      <span class="aui-demo-desc">{{ title ?? "" }}</span>
      <div class="aui-demo-actions">
        <button
          class="aui-action-btn"
          :class="{ active: expanded }"
          :title="expanded ? '收起代码' : '展开代码'"
          @click="expanded = !expanded"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline v-if="!expanded" points="6 9 12 15 18 9" />
            <polyline v-else points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 代码区（可展开） -->
    <div v-show="expanded" class="aui-demo-code">
      <span class="aui-lang-label">vue</span>
      <button
        class="aui-copy-btn"
        :class="{ copied }"
        @click="copyCode"
        title="复制代码"
      >
        <span v-if="copied" class="aui-copy-label">已复制</span>
        <svg
          v-if="copied"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      </button>
      <div v-html="code.html" />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
import { withBase } from "vitepress";

const props = defineProps<{
  component: any;
  code: { raw: string; html: string; srcPath: string };
  title?: string;
}>();

const expanded = ref(false);
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

function openLive() {
  const url = `/playground.html?demo=${props.code.srcPath}`;
  window.open(withBase(url), "_blank");
}

async function copyCode() {
  await navigator.clipboard.writeText(props.code.raw);
  copied.value = true;
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<style scoped>
.aui-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  margin: 20px 0;
}

.aui-demo-preview {
  padding: 32px 24px;
  min-height: 80px;
  background: var(--vp-c-bg);
}

.aui-demo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px 6px 16px;
  min-height: 40px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.aui-demo-desc {
  flex: 1;
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.aui-demo-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.aui-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.aui-action-btn:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}
.aui-action-btn.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.aui-demo-code {
  position: relative;
  border-top: 1px solid var(--vp-c-divider);
}
.aui-demo-code :deep(pre) {
  margin: 0;
  border-radius: 0;
}

.aui-lang-label {
  position: absolute;
  top: 2px;
  right: 12px;
  z-index: 2;
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  color: var(--vp-code-lang-color);
  transition: color 0.4s, opacity 0.4s;
}
.aui-demo-code:hover .aui-lang-label {
  opacity: 0;
}

.aui-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s,
    box-shadow 0.15s;
  opacity: 0;
}
.aui-demo-code:hover .aui-copy-btn {
  opacity: 1;
}
.aui-copy-btn:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.aui-copy-btn.copied {
  opacity: 1;
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>
