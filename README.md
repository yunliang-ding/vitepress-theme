# @lite-code/vitepress-theme

基于 VitePress 的共享文档主题，支持 **React** 和 **Vue** 组件库文档站点，提供统一的 Demo 展示、代码高亮、在线 Playground 调试能力。

## 核心功能

| 功能                                | React             | Vue            |
| ----------------------------------- | ----------------- | -------------- |
| Demo 组件（预览 + 代码展开 + 复制） | ✅                | ✅             |
| 在线 Playground（全屏编辑调试）     | ✅ (sucrase 编译) | ✅ (@vue/repl) |
| 主题切换（dark/light + 多色系）     | ✅                | ✅             |
| Shiki 代码高亮插件                  | ✅ (.tsx)         | ✅ (.vue)      |
| layout: playground 全屏模式         | ✅                | ✅             |

## 安装

```bash
pnpm add @lite-code/vitepress-theme
```

### 对等依赖

```json
{
  "vue": "^3.4.0",
  "vitepress": ">=1.6.0",
  // React 文档额外需要
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "sucrase": "3.35.1",
  "@lite-code/editor": "0.0.1",
  // Vue 文档额外需要
  "@vue/repl": "^4.0.0"
}
```

---

## React 文档站使用

### 1. 配置 VitePress 主题

```ts
// .vitepress/theme/index.ts
import docsTheme from "@lite-code/vitepress-theme"; // 默认导出 react 入口
import { provide, h, defineComponent } from "vue";

const Layout = defineComponent({
  setup() {
    provide("theme-hooks", {
      onThemeChange(info) {
        // 可选：响应主题/色系变更
      },
    });

    // 注入 Playground 配置
    provide("playground-config", {
      codeGlobs: import.meta.glob("../../demos/**/*.tsx", {
        query: "?raw",
        import: "default",
      }),
      loadModules: () =>
        import("@lite-code/aui").then((m) => ({
          "@lite-code/aui": m,
        })),
    });

    return () => h(docsTheme.Layout);
  },
});

export default {
  ...docsTheme,
  Layout,
};
```

### 2. 配置 Vite 插件（Shiki 高亮）

```ts
// .vitepress/config.ts
import { shikiRawPlugin } from "@lite-code/vitepress-theme/plugins/shiki-raw";

export default defineConfig({
  vite: {
    plugins: [
      shikiRawPlugin({ theme: { light: "light-plus", dark: "dark-plus" } }),
    ],
  },
});
```

### 3. 在 Markdown 中使用 Demo 组件

```md
<Demo :component="BasicDemo" :code="BasicDemoCode" title="基础用法" />

<script setup>
import BasicDemo from '../../demos/button/basic.tsx'
import BasicDemoCode from '../../demos/button/basic.tsx?raw'
</script>
```

### 4. Playground 页面

创建 `playground.md`：

```md
---
layout: playground
---
```

Demo 组件的"在线调试"按钮会跳转到 `/playground?demo=button/basic`，自动加载对应源码。

### Playground 配置说明 (provide)

```ts
provide("playground-config", {
  // 通过 import.meta.glob 获取所有 demo 源码
  codeGlobs: import.meta.glob("../../demos/**/*.tsx", {
    query: "?raw",
    import: "default",
  }),
  // 返回运行时依赖模块映射
  loadModules: () =>
    Promise.resolve({
      "@lite-code/aui": auiModule,
      "some-other-lib": otherModule,
    }),
});
```

---

## Vue 文档站使用

### 1. 配置 VitePress 主题

```ts
// .vitepress/theme/index.ts
import docsTheme from "@lite-code/vitepress-theme/vue";
import { provide, h, defineComponent } from "vue";

const Layout = defineComponent({
  setup() {
    provide("theme-hooks", {
      onThemeChange(info) {
        // 可选：响应主题/色系变更
      },
    });

    // 注入 Playground 配置
    provide("vue-playground-config", {
      imports: {
        "@lite-code/aui-vue": "/libs/aui-vue.esm.js",
      },
      css: ["/libs/styles.css"],
      codeGlobs: import.meta.glob("../../demos/**/*.vue", {
        query: "?raw",
        import: "default",
      }),
    });

    return () => h(docsTheme.Layout);
  },
});

export default {
  ...docsTheme,
  Layout,
};
```

### 2. 配置 Vite 插件（Shiki 高亮）

```ts
// .vitepress/config.ts
import { vueRawPlugin } from "@lite-code/vitepress-theme/plugins/shiki-vue";

export default defineConfig({
  vite: {
    plugins: [
      vueRawPlugin({ theme: { light: "light-plus", dark: "dark-plus" } }),
    ],
  },
});
```

### 3. 准备组件库 ESM 产物

Vue Playground 基于 `@vue/repl`，在独立 iframe sandbox 中运行，需要通过 URL 加载组件库：

```bash
# 打包组件库为 ESM 格式（vue external）
pnpm build

# 将产物放到 VitePress public 目录
mkdir -p public/libs
cp dist/index.esm.js public/libs/aui-vue.esm.js
cp dist/styles.css public/libs/styles.css
```

### 4. 在 Markdown 中使用 Demo 组件

```md
<Demo :component="BasicDemo" :code="BasicDemoCode" title="基础用法" />

<script setup>
import BasicDemo from '../../demos/button/basic.vue'
import BasicDemoCode from '../../demos/button/basic.vue?raw'
</script>
```

### 5. Playground 页面

创建 `playground.md`：

```md
---
layout: playground
---
```

Demo 组件的"在线调试"按钮会跳转到 `/playground?demo=button/basic`，在全屏 `@vue/repl` 中加载源码。

### Playground 配置说明 (provide)

```ts
provide("vue-playground-config", {
  // importMap：sandbox iframe 中可 import 的包名 → ESM URL 映射
  // 支持相对路径（自动拼接 origin）或完整 URL
  imports: {
    "@lite-code/aui-vue": "/libs/aui-vue.esm.js",
    "some-other-lib": "https://cdn.example.com/lib.esm.js",
  },
  // 注入到 sandbox iframe <head> 的 CSS 样式
  css: ["/libs/styles.css"],
  // demo 源码 glob（用于 ?demo=xxx 加载代码）
  codeGlobs: import.meta.glob("../../demos/**/*.vue", {
    query: "?raw",
    import: "default",
  }),
});
```

---

## 主题切换 Hook

两个入口都支持通过 `provide("theme-hooks", ...)` 注入主题变更回调：

```ts
provide("theme-hooks", {
  onThemeChange(info: { theme: "dark" | "light"; color: string }) {
    // info.theme: 当前明暗模式
    // info.color: 当前色系 RGB 值
    document.documentElement.style.setProperty("--brand-color", info.color);
  },
});
```

内置色系：山药蓝、生机绿、活力橙、科技紫、魅力粉、喜庆红。

---

## 导出入口

| 路径                                       | 说明                        |
| ------------------------------------------ | --------------------------- |
| `@lite-code/vitepress-theme`                   | React 文档主题（默认）      |
| `@lite-code/vitepress-theme/vue`               | Vue 文档主题                |
| `@lite-code/vitepress-theme/plugins/shiki-raw` | React (.tsx) Shiki 高亮插件 |
| `@lite-code/vitepress-theme/plugins/shiki-vue` | Vue (.vue) Shiki 高亮插件   |

---

## 目录结构

```
@lite-code/vitepress-theme/
├── react/
│   ├── index.ts          # React 主题入口
│   ├── layout.vue        # Layout（含 playground 判断 + 主题切换）
│   ├── demo.vue          # Demo 组件（React 渲染 + 代码展示）
│   └── playground.vue    # 全屏 Playground（sucrase 编译 TSX）
├── vue/
│   ├── index.ts          # Vue 主题入口
│   ├── layout.vue        # Layout（含 playground 判断 + 主题切换）
│   ├── demo.vue          # Demo 组件（Vue 渲染 + 代码展示）
│   └── playground.vue    # 全屏 Playground（@vue/repl）
├── plugins/
│   ├── shiki-react.js    # .tsx?raw Shiki 高亮 Vite 插件
│   └── shiki-vue.js      # .vue?raw Shiki 高亮 Vite 插件
├── color/                # 色系切换逻辑
├── drop-down.vue         # 色系选择下拉菜单
├── theme.css             # 共享主题样式
└── package.json
```
