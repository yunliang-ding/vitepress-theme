// @ts-nocheck
import DefaultTheme from "vitepress/theme";
import Layout from "./layout.vue";
import Demo from "./demo.vue";
import "./theme.css";

export interface ThemeHooks {
  /** 主题或颜色变更时触发（dark/light 切换、颜色切换都会调用） */
  onThemeChange?: (info: { theme: "dark" | "light"; color: string }) => void;
}

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: import("vue").App }) {
    app.component("Demo", Demo);
  },
};
