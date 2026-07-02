<script setup lang="ts">
// @ts-ignore
import { useData } from "vitepress";
// @ts-ignore
import DefaultTheme from "vitepress/theme";
// @ts-ignore
import Playground from "./playground.vue";
// @ts-ignore
import { nextTick, provide } from "vue";

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
</script>

<template>
  <Playground v-if="frontmatter.layout === 'playground'" />
  <DefaultTheme.Layout v-else>
    <template #nav-bar-content-after>
      <slot name="nav-bar-content-after" />
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

/** 自定义样式 */
h3 {
  margin-bottom: 16px !important;
}

table {
  display: table !important;
  margin: 0 !important;
}

a {
  text-decoration: none !important;
}

.vp-doc li+li {
  margin-top: 0 !important;
}

.vp-doc th,
.vp-doc td {
  border: none;
}

.vp-doc ul,
.vp-doc ol {
  padding-left: 0 !important;
  margin: 0 !important;
}

.vp-doc blockquote {
  border-left: 2px solid var(--primary-color);
  padding-left: 10px;
  color: var(--vp-c-text-1) !important;
}

#api+table {
  width: 100%;
}

blockquote+table {
  width: 100%;
}

p.text {
  margin-bottom: 1em;
}

h2.text {
  margin-top: 20px;
  margin-bottom: 0.5em;
}

/* 调整样式 */
body {
  --vp-code-font-size: 12px !important;
}

.VPDoc.has-aside .content-container {
  max-width: 940px;
}

.VPDoc .content {
  min-width: 940px;
  padding: 0;
}

.VPDoc .content .content-container {
  max-width: 100% !important;
}

.VPDoc .prev-next {
  padding-bottom: 40px !important;
}

.VPDocAside .content {
  padding-left: 10px;
}

.VPHomeHero .text {
  margin-top: 12px !important;
}

#VPContent.has-sidebar {
  padding-right: 0;
  padding-left: 260px;
}

.VPSidebar {
  padding-left: 60px !important;
  width: 280px !important;
}

.VPNavBar.has-sidebar .container>.title {
  padding-left: 60px !important;
  width: 280px !important;
}

.VPNavBar.has-sidebar .content {
  padding-left: 280px !important;
}

.VPNavBar.has-sidebar .divider {
  padding-left: 300px !important;
}

.content-container {
  margin-left: 30px !important;
}

.vp-doc td,
.vp-doc th {
  font-size: 12px;
}

.custom-block {
  padding: 12px 30px !important;
}

.custom-block-title {
  display: none;
}

.VPHomeHero .image-bg {
  background-image: linear-gradient(-45deg, #646cffcc 50%, #ffd14785 50%);
  filter: blur(68px);
}

.vp-doc tr:nth-child(2n) {
  background-color: transparent;
}

.vp-doc h2 {
  border-top: none;
  margin: 10px;
}

h2.text {
  margin-top: 0;
}

:root {
  --soui-brand-6: #197afa;
  --soui-font-14: 12px;
  --soui-tabs-tab-font-size: 12px;
  --soui-14-regular: 12px;
  --vp-c-brand-1: var(--soui-brand-6);
  --vp-c-brand-2: var(--soui-brand-6);
  --vp-button-brand-bg: var(--soui-brand-6);
}

body {
  font-size: 12px;
}

.VPNavBar.has-sidebar .content {
  padding-right: 40px !important;
}

h2 {
  margin-left: 0 !important;
}

.VPImage.logo {
  border-radius: 50%;
  height: 30px;
}

.vp-doc[class*=" _interview"] .custom-block {
  padding: 16px !important;
}

.vp-doc[class*=" _interview"] .custom-block summary {
  margin-bottom: 0 !important;
}

.vp-doc[class*=" _interview"] .custom-block p {
  margin: 0 !important;
}
</style>
