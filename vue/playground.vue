<script setup lang="ts">
// @ts-nocheck
/**
 * Vue SFC Playground 全屏组件
 *
 * 使用方需通过 provide 注入以下配置：
 *   provide("vue-playground-config", {
 *     imports: {
 *       "@yl_lowcode/aui-vue": "/libs/aui-vue.esm.js",
 *     },
 *     css: ["/libs/styles.css"],
 *     codeGlobs: import.meta.glob("../../demos/**\/*.vue", { query: "?raw", import: "default" }),
 *   })
 */
import { ref, inject, computed, onMounted } from "vue";
import { Repl, useStore, useVueImportMap } from "@vue/repl";
import CodeMirror from "@vue/repl/codemirror-editor";
import "@vue/repl/style.css";

const config = inject<{
  imports?: Record<string, string>;
  css?: string[];
  codeGlobs?: Record<string, () => Promise<any>>;
}>("vue-playground-config", {});

// 将相对路径转为绝对 URL（iframe sandbox 需要）
function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (typeof window !== "undefined") return window.location.origin + url;
  return url;
}

// 构建 importMap（所有路径转为绝对）
const resolvedImports = computed(() => {
  const imports: Record<string, string> = {};
  if (config.imports) {
    for (const [key, val] of Object.entries(config.imports)) {
      imports[key] = toAbsoluteUrl(val);
    }
  }
  return imports;
});

// 构建 CSS link 注入
const previewOptions = computed(() => {
  const links = (config.css || [])
    .map((url) => `<link rel="stylesheet" href="${toAbsoluteUrl(url)}" />`)
    .join("\n");
  return { headHTML: links };
});

const { importMap: builtinImportMap } = useVueImportMap({
  vueVersion: "3.5.34",
});

const defaultCode = `<template>
  <div style="padding: 24px;">
    <h3>Vue Playground</h3>
    <p>在左侧编辑代码，右侧实时预览</p>
  </div>
</template>
`;

const store = useStore({
  builtinImportMap,
  template: ref({
    welcomeSFC: defaultCode,
  }),
});

// 从外部配置注入 importMap
store.setImportMap({ imports: resolvedImports.value }, true);

onMounted(async () => {
  // 从 URL query 加载 demo 代码
  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  if (demo && config.codeGlobs) {
    // 调试：查看实际的 glob keys 和 demo 值
    const keys = Object.keys(config.codeGlobs);
    // 匹配策略：glob key 可能是相对路径如 ../../demos/checkbox/basic.vue
    // demo 参数格式为 checkbox/basic（无前缀、无后缀）
    const matchKey = keys.find(
      (k) => k.endsWith(`/${demo}.vue`) || k.endsWith(`/${demo}.tsx`) || k.endsWith(`/${demo}.ts`)
    );
    if (matchKey) {
      const rawCode = await config.codeGlobs[matchKey]();
      // rawCode 可能是字符串、或 { raw, html, srcPath } 对象（经 shiki-vue 插件处理）
      let code: string;
      if (typeof rawCode === "string") {
        code = rawCode;
      } else if (rawCode?.raw) {
        code = rawCode.raw;
      } else if (rawCode?.default) {
        code = typeof rawCode.default === "string" ? rawCode.default : rawCode.default.raw || "";
      } else {
        code = String(rawCode);
      }
      await store.setFiles({
        "App.vue": code,
        "import-map.json": JSON.stringify({
          imports: {
            ...store.getImportMap().imports,
            ...resolvedImports.value,
          },
        }),
      });
    }
  }

  store.init();
});
</script>

<template>
  <div class="playground-page">
    <Repl
      :store="store"
      :editor="CodeMirror"
      :preview-options="previewOptions"
      :show-compile-output="false"
      :clear-console="false"
    />
  </div>
</template>

<style scoped>
.playground-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.playground-page :deep(.vue-repl) {
  height: 100%;
}
</style>
