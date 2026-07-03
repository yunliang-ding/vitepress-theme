<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, onUnmounted } from "vue";

// --- 1. 定义配置项接口 ---
export interface DropdownItem {
  id?: string | number;
  label?: string; // 显示的文字
  color?: string; // 【核心】自定义颜色 (如 '#ff4d4f', 'blue', 'rgb(0,0,0)')
  disabled?: boolean; // 是否禁用
  divider?: boolean; // 是否是分割线
  onClick?: () => void; // 点击回调
}

// --- 2. Props 定义 ---
const props = withDefaults(
  defineProps<{
    options: DropdownItem[]; // 配置数组
    width?: string; // 下拉框宽度
    trigger?: "click" | "hover";
  }>(),
  {
    options: () => [],
    width: "180px",
    trigger: "click",
  }
);

// --- 3. 状态管理 ---
const visible = ref(false);
const containerRef = ref<HTMLElement | null>(null);

// 切换显示
const toggle = () => {
  if (props.trigger === "hover") return;
  visible.value = !visible.value;
};

// Hover 逻辑
const handleMouseEnter = () => {
  if (props.trigger === "hover") visible.value = true;
};
const handleMouseLeave = () => {
  if (props.trigger === "hover") visible.value = false;
};

// --- 4. 点击菜单项逻辑 ---
const handleItemClick = (item: DropdownItem) => {
  if (item.disabled || item.divider) return;

  // 关闭菜单
  visible.value = false;

  // 执行回调
  if (typeof item.onClick === "function") {
    item.onClick();
  }
};

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    visible.value = false;
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div
    class="dropdown-container"
    ref="containerRef"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 触发器 (Slot) -->
    <div class="trigger-wrapper" @click.stop="toggle">
      <slot name="trigger">
        <button class="default-btn">菜单 ▾</button>
      </slot>
    </div>

    <!-- 下拉菜单 -->
    <transition name="scale-fade">
      <div v-if="visible" class="dropdown-menu" :style="{ width: width }">
        <ul class="menu-list">
          <li
            class="menu-item"
            @click.stop="handleItemClick(item)"
            v-for="item in options"
            :key="item.label"
          >
            <!-- 核心：动态绑定颜色 -->
            <span class="item-label">
              {{ item.label }}
            </span>
            <span
              v-if="item.color"
              :style="{ background: item.color }"
              class="item-color"
            />
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
  display: inline-block;
}

.trigger-wrapper {
  cursor: pointer;
  display: flex;
}

/* 下拉框主体 */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px); /* 距离触发器下方 8px */
  right: -20px;
  /* 如果需要居右对齐，把 left:0 改为 right:0 */
  background-color: var(--soui-neutral-fill-2);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--soui-neutral-border-1);
  padding: 6px 0;
  z-index: 2000;
  overflow: hidden;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 菜单项样式 */
.menu-item {
  padding: 4px 16px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
  display: flex;
  gap: 4px;
  align-items: center;
  user-select: none;
}

.menu-item:hover {
  background-color: var(--soui-neutral-fill-3); /* 浅灰色 hover 背景 */
}

/* Label 样式 */
.item-label {
  color: var(--vp-custom-block-info-text);
  font-weight: 500;
  flex: 1;
}

.item-color {
  border-radius: 50%;
  width: 8px;
  height: 8px;
  display: inline-block;
}

/* 默认按钮样式 */
.default-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

/* 动画效果 */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
}
</style>