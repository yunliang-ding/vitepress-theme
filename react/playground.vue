<script setup lang="ts">
// @ts-nocheck
import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { ref, inject, onMounted, onBeforeUnmount, watch } from "vue";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
/**
 * 通用 Playground 组件
 *
 * 使用方需通过 provide 注入以下配置：
 *   provide("playground-config", {
 *     codeGlobs: import.meta.glob("../../demos/**\/*.tsx", { query: "?raw", import: "default" }),
 *     loadModules: () => import("@lite-code/editor").then(m => ({ "@lite-code/editor": m })),
 *   })
 */
const config = inject<{
  codeGlobs: Record<string, () => Promise<any>>;
  loadModules: () => Promise<Record<string, any>>;
}>("playground-config");

const containerRef = ref<HTMLElement | null>(null);
const editorRef = ref<HTMLElement | null>(null);
const code = ref("");
const isDark = ref(true);
let reactRoot: any = null;
let renderPreview: ((code: string) => void) | null = null;
let editorView: EditorView | null = null;
const themeCompartment = new Compartment();

// 切换暗色/亮色主题
function toggleDark() {
  isDark.value = !isDark.value;
  editorView?.dispatch({
    effects: themeCompartment.reconfigure(isDark.value ? oneDark : []),
  });
}

onMounted(async () => {
  if (!containerRef.value || !config) return;

  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  if (!demo) return;

  // 在 globs 中查找匹配的 demo 文件
  const matchKey = Object.keys(config.codeGlobs).find((k) =>
    k.includes(`/${demo}.tsx`)
  );
  if (!matchKey) return;

  const rawCode = (await config.codeGlobs[matchKey]()).raw as string;
  const { transform } = await import("sucrase");
  const userModules = await config.loadModules();

  code.value = rawCode;

  // 初始化 CodeMirror 6 编辑器
  if (editorRef.value) {
    editorView = new EditorView({
      state: EditorState.create({
        doc: rawCode,
        extensions: [
          basicSetup,
          javascript({ jsx: true, typescript: true }),
          themeCompartment.of(oneDark),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              code.value = update.state.doc.toString();
            }
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "12px" },
            ".cm-scroller": { overflow: "auto" },
            ".cm-gutters": { fontSize: "12px" },
          }),
        ],
      }),
      parent: editorRef.value,
    });
  }

  // 编译函数：将 TSX 代码转换为可执行模块
  function compileCode(code: string, moduleMap: Record<string, any>) {
    try {
      const normalizedCode = /\bimport\s+React\b/.test(code)
        ? code
        : `import React from "react";\n${code}`;
      const { code: compiled } = transform(normalizedCode, {
        transforms: ["typescript", "jsx", "imports"],
        jsxRuntime: "classic",
      });
      if (!compiled) return { component: null, error: "编译无输出" };

      const require = (name: string) => {
        const resolved = moduleMap[name];
        if (resolved !== undefined) return resolved;
        throw new Error(`未找到模块: "${name}"`);
      };

      const exports = {} as Record<string, unknown>;
      new Function("require", "module", "exports", compiled)(
        require,
        { exports },
        exports
      );

      const Component = (exports.default ?? exports) as React.ComponentType;
      const component = typeof Component === "function" ? Component : null;
      return { component, error: component ? null : "export default 不是函数" };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      return { component: null, error };
    }
  }

  // ErrorBoundary
  class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    { error: string | null }
  > {
    constructor(props: React.PropsWithChildren<{}>) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(err: unknown) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
    render() {
      if (this.state.error) {
        return React.createElement(
          "div",
          {
            style: {
              margin: 0,
              padding: "12px 16px",
              color: "#ef4444",
              fontSize: "12px",
              fontFamily: "monospace",
              borderBottom: "1px solid rgba(239,68,68,.2)",
              background: "rgba(239,68,68,.05)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: "160px",
              overflow: "auto",
            },
          },
          "Runtime error: " + this.state.error
        );
      }
      return (this.props as any).children;
    }
  }

  // 合并模块映射（react 始终提供）
  const moduleMap: Record<string, any> = {
    react: React,
    ...userModules,
  };

  function App() {
    const [Preview, setPreview] = React.useState(
      () => compileCode(rawCode, moduleMap).component
    );
    const [error, setError] = React.useState(
      () => compileCode(rawCode, moduleMap).error
    );

    // 暴露更新方法给 Vue 侧调用
    renderPreview = (newCode: string) => {
      const { component, error: err } = compileCode(newCode, moduleMap);
      setPreview(() => component);
      setError(err);
    };

    return React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" } },
      error &&
        React.createElement(
          "div",
          {
            style: {
              margin: 0,
              padding: "12px 16px",
              color: "#ef4444",
              fontSize: "12px",
              fontFamily: "monospace",
              borderBottom: "1px solid rgba(239,68,68,.2)",
              background: "rgba(239,68,68,.05)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: "160px",
              overflow: "auto",
            },
          },
          error
        ),
      React.createElement(
        ErrorBoundary,
        { key: code.value },
        React.createElement(
          "div",
          { style: { flex: 1, padding: "24px", overflow: "auto" } },
          Preview && React.createElement(Preview)
        )
      )
    );
  }

  reactRoot = ReactDOMClient.createRoot(containerRef.value);
  reactRoot.render(React.createElement(App));

  // 监听 Vue 侧 code 变化，驱动 React 预览更新
  watch(code, (newCode) => {
    if (renderPreview) renderPreview(newCode);
  });
});

onBeforeUnmount(() => {
  reactRoot?.unmount();
  editorView?.destroy();
});
</script>

<template>
  <div class="playground-page">
    <div class="playground-layout">
      <!-- 左侧：CodeMirror 编辑器 -->
      <div class="playground-editor-wrap">
        <div ref="editorRef" class="playground-editor" />
        <div class="playground-toolbar" :class="{ dark: isDark }">
          <label class="toolbar-toggle">
            <span>Dark Mode</span>
            <button
              class="toggle-switch"
              :class="{ active: isDark }"
              @click="toggleDark"
              role="switch"
              :aria-checked="isDark"
            >
              <span class="toggle-knob" />
            </button>
          </label>
        </div>
      </div>
      <!-- 右侧：React 预览 -->
      <div ref="containerRef" class="playground-preview" />
    </div>
  </div>
</template>

<style scoped>
.playground-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.playground-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.playground-editor-wrap {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.playground-toolbar {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e5e5e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
  backdrop-filter: blur(4px);
  transition: background 0.2s, border-color 0.2s;
}

.playground-toolbar.dark {
  background: rgba(40, 44, 52, 0.92);
  border-color: #3e4451;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.playground-toolbar.dark .toolbar-toggle {
  color: #abb2bf;
}

.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  user-select: none;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: #d9d9d9;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.toggle-switch.active {
  background: #52c41a;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(18px);
}

.playground-editor {
  flex: 1;
  overflow: hidden;
}

.playground-preview {
  flex: 1;
  overflow: hidden;
}
</style>
