<script setup lang="ts">
// @ts-nocheck
import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { ref, inject, onMounted, onBeforeUnmount } from "vue";
import { Monaco as MonacoEditor } from "@yl_lowcode/editor";
/**
 * 通用 Playground 组件
 *
 * 使用方需通过 provide 注入以下配置：
 *   provide("playground-config", {
 *     codeGlobs: import.meta.glob("../../demos/**\/*.tsx", { query: "?raw", import: "default" }),
 *     loadModules: () => import("@yl_lowcode/editor").then(m => ({ "@yl_lowcode/editor": m })),
 *   })
 */
const config = inject<{
  codeGlobs: Record<string, () => Promise<any>>;
  loadModules: () => Promise<Record<string, any>>;
}>("playground-config");

const containerRef = ref<HTMLElement | null>(null);
let reactRoot: any = null;

onMounted(async () => {
  if (!containerRef.value || !config) return;

  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");
  if (!demo) return;

  // 在 globs 中查找匹配的 demo 文件
  const matchKey = Object.keys(config.codeGlobs).find((k) => k.includes(`/${demo}.tsx`));
  if (!matchKey) return;

  const rawCode = (await config.codeGlobs[matchKey]()).raw as string;
  const { transform } = await import("sucrase");
  const userModules = await config.loadModules();

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
        exports,
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
          "Runtime error: " + this.state.error,
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
    const [code, setCode] = React.useState(rawCode);
    const [Preview, setPreview] = React.useState(
      () => compileCode(rawCode, moduleMap).component,
    );
    const [error, setError] = React.useState(
      () => compileCode(rawCode, moduleMap).error,
    );

    const handleCodeChange = React.useCallback((newCode: string) => {
      setCode(newCode);
      const { component, error: err } = compileCode(newCode, moduleMap);
      setPreview(() => component);
      setError(err);
    }, []);

    return React.createElement(
      "div",
      { style: { display: "flex", height: "100vh", overflow: "hidden" } },
      // 左侧：Monaco 编辑器
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            borderRight: "1px solid var(--vp-c-divider)",
            overflow: "hidden",
          },
        },
        MonacoEditor
          ? React.createElement(MonacoEditor, {
              value: code,
              language: "javascript",
              style: { height: "100%" },
              onChange: handleCodeChange,
            })
          : React.createElement("textarea", {
              value: code,
              onChange: (e: any) => handleCodeChange(e.target.value),
              style: { width: "100%", height: "100%", fontFamily: "monospace", padding: "16px" },
            }),
      ),
      // 右侧：预览 + 错误
      React.createElement(
        "div",
        {
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
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
            error,
          ),
        React.createElement(
          ErrorBoundary,
          { key: code },
          React.createElement(
            "div",
            { style: { flex: 1, padding: "24px", overflow: "auto" } },
            Preview && React.createElement(Preview),
          ),
        ),
      ),
    );
  }

  reactRoot = ReactDOMClient.createRoot(containerRef.value);
  reactRoot.render(React.createElement(App));
});

onBeforeUnmount(() => {
  reactRoot?.unmount();
});
</script>

<template>
  <div class="playground-page">
    <div ref="containerRef" class="playground-container" />
  </div>
</template>

<style scoped>
.playground-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.playground-container {
  width: 100%;
  height: 100%;
}
</style>
