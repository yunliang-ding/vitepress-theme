import { readFileSync } from "fs";
import { createMarkdownRenderer } from "vitepress";

let mdPromise = null;

function getMd(srcDir, options) {
  if (!mdPromise) {
    mdPromise = createMarkdownRenderer(srcDir, options);
  }
  return mdPromise;
}

export function shikiRawPlugin(options) {
  let srcDir = process.cwd();

  return {
    name: "vite-plugin-shiki-raw",
    enforce: "pre",
    configResolved(config) {
      srcDir = config.root;
    },
    async load(id) {
      if (!id.endsWith("?raw")) return null;

      const filePath = id.slice(0, -4);
      if (!filePath.endsWith(".tsx")) return null;

      const raw = readFileSync(filePath, "utf-8");
      const md = await getMd(srcDir, options);
      const html =
        typeof md.renderAsync === "function"
          ? await md.renderAsync("```tsx\n" + raw + "\n```")
          : md.render("```tsx\n" + raw + "\n```");

      const demosIdx = filePath.indexOf("/demos/");
      const srcPath = demosIdx >= 0 ? filePath.slice(demosIdx + 7, -4) : "";

      return `export default ${JSON.stringify({ raw, html, srcPath })}`;
    },
  };
}
