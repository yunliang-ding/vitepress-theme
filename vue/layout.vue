<script setup lang="ts">
// @ts-nocheck
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";
import setTheme from "../color";
import {
  defineAsyncComponent,
  watch,
  nextTick,
  provide,
  inject,
  onMounted,
} from "vue";
import type { ThemeHooks } from "../index";
// @ts-ignore
import NiceDropdown from "../drop-down.vue";

// 仅客户端加载 Playground（包含 CSS import，SSR 不支持）
const Playground = defineAsyncComponent(() => import("./playground.vue"));

const themeHooks = inject<ThemeHooks>("theme-hooks", {});

const colorConfig = [
  {
    key: "blue",
    label: "山药蓝",
    color: "#197AFA",
  },
  {
    key: "green",
    label: "生机绿",
    color: "#29CC97",
  },
  {
    key: "orange",
    label: "活力橙",
    color: "#F75229",
  },
  {
    key: "purple",
    label: "科技紫",
    color: "#6463D5",
  },
  {
    key: "pink",
    label: "魅力粉",
    color: "#d84293",
  },
  {
    key: "red",
    label: "喜庆红",
    color: "#eb4242",
  },
].map((item: any) => {
  return {
    ...item,
    onClick: async () => {
      localStorage?.setItem("color", item.key);
      const rgbColor = setTheme(isDark.value ? "dark" : "light", item.key);
      themeHooks.onThemeChange?.({
        theme: isDark.value ? "dark" : "light",
        color: rgbColor,
      });
    },
  };
});

const { frontmatter, isDark } = useData();

const enableTransitions = () =>
  "startViewTransition" in document &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

provide("toggle-appearance", async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value;
    return;
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )}px at ${x}px ${y}px)`,
  ];
  // @ts-ignore
  await document.startViewTransition(async () => {
    isDark.value = !isDark.value;
    await nextTick();
  }).ready;

  document.documentElement.animate(
    { clipPath: isDark.value ? clipPath.reverse() : clipPath },
    {
      duration: 300,
      easing: "ease-in",
      fill: "forwards",
      pseudoElement: `::view-transition-${isDark.value ? "old" : "new"}(root)`,
    }
  );
});

onMounted(() => {
  watch(isDark, async (dark) => {
    const color = localStorage?.getItem("color") as any;
    const rgbColor = setTheme(dark ? "dark" : "light", color);
    themeHooks.onThemeChange?.({
      theme: dark ? "dark" : "light",
      color: rgbColor || "blue",
    });
  });
  setTimeout(async () => {
    const color = localStorage?.getItem("color") as any;
    const rgbColor = setTheme(isDark.value ? "dark" : "light", color);
    themeHooks.onThemeChange?.({
      theme: isDark.value ? "dark" : "light",
      color: rgbColor || "blue",
    });
  }, 800);
});
</script>

<template>
  <ClientOnly v-if="frontmatter.layout === 'playground'">
    <Playground />
  </ClientOnly>
  <DefaultTheme.Layout v-else>
    <template #nav-bar-content-after>
      <slot name="nav-bar-content-after" />
      <NiceDropdown :options="colorConfig" width="90px">
        <template #trigger>
          <svg
            viewBox="0 0 24 24"
            width="16px"
            height="16px"
            fill="var(--soui-brand-6)"
            style="margin-left: 20px"
          >
            <path
              d="M8.36107 2.0003C8.55307 1.99563 8.74236 2.04634 8.9063 2.14639L13.4505 4.91945L18.472 3.15178C18.9929 2.96839 19.5639 3.24204 19.7473 3.76299C19.811 3.94415 19.8213 4.13984 19.7768 4.32667L18.5437 9.50539L21.7766 13.7348C22.112 14.1736 22.0282 14.8012 21.5894 15.1366C21.4368 15.2532 21.2538 15.3235 21.0624 15.3389L15.7561 15.7664L12.7327 20.1481C12.419 20.6026 11.7962 20.7169 11.3417 20.4032C11.1836 20.2941 11.0603 20.1418 10.9864 19.9645L9.20794 15.694L3.89851 21.0041C3.50799 21.3946 2.87482 21.3946 2.4843 21.0041C2.09378 20.6135 2.09378 19.9804 2.4843 19.5898L7.46294 14.61L3.83862 13.5286C3.30937 13.3708 3.00828 12.8138 3.16613 12.2845C3.22102 12.1005 3.32774 11.9361 3.47355 11.8111L7.51513 8.34624L7.38569 3.02432C7.37226 2.47219 7.80895 2.01372 8.36107 2.0003ZM9.52452 5.45242C9.47449 5.53441 9.44913 5.62908 9.45148 5.7251L9.53762 9.24671L6.86306 11.5395C6.65341 11.7192 6.62914 12.0348 6.80887 12.2445C6.87138 12.3174 6.95357 12.3708 7.04561 12.3982L10.4215 13.4048L11.775 16.6557C11.8811 16.9107 12.1738 17.0313 12.4288 16.9252C12.5174 16.8883 12.5935 16.8266 12.648 16.7476L14.6492 13.8492L18.1593 13.5657C18.4346 13.5435 18.6397 13.3023 18.6174 13.0271C18.6097 12.9314 18.5746 12.84 18.5163 12.7637L16.3782 9.96569L17.1935 6.5383C17.2574 6.26966 17.0914 6.00007 16.8228 5.93616C16.7294 5.91394 16.6315 5.91909 16.541 5.951L13.2191 7.12122L10.2118 5.28607C9.97606 5.14222 9.66836 5.21671 9.52452 5.45242Z"
            />
          </svg>
        </template>
      </NiceDropdown>
    </template>
    <template #sidebar-nav-before>
      <slot name="sidebar-nav-before" />
    </template>
  </DefaultTheme.Layout>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}
</style>
