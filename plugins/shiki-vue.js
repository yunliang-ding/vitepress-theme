import { readFileSync } from "fs";
import { createMarkdownRenderer } from "vitepress";

let mdPromise = null;

function getMd(srcDir, options) {
  if (!mdPromise) {
    mdPromise = createMarkdownRenderer(srcDir, options);
  }
  return mdPromise;
}

// 配置文件变更时 VitePress 会重新加载插件，重置单例避免引用已销毁的 Shiki 实例
export function resetMd() {
  mdPromise = null;
}

/**
 * 为 .vue?raw 添加 Shiki 高亮 HTML，同时保留原始源码字符串。
 * 返回对象：{ raw: string; html: string; srcPath: string }
 */
export function vueRawPlugin(options) {
  let srcDir = process.cwd();

  return {
    name: "vite-plugin-vue-raw",
    enforce: "pre",
    configResolved(config) {
      srcDir = config.root;
    },
    async load(id) {
      if (!id.endsWith("?raw")) return null;

      const filePath = id.slice(0, -4);
      if (!filePath.endsWith(".vue")) return null;

      const raw = readFileSync(filePath, "utf-8");
      const md = await getMd(srcDir, options);
      const html = await md.renderAsync("```vue\n" + raw + "\n```");

      const demosIdx = filePath.indexOf("/demos/");
      const srcPath = demosIdx >= 0 ? filePath.slice(demosIdx + 7, -4) : "";

      return `export default ${JSON.stringify({ raw, html, srcPath })}`;
    },
  };
}
