// @ts-nocheck
import DefaultTheme from "vitepress/theme";
import Layout from "./layout.vue";
import Demo from "./demo.vue";
import "./theme.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: { app: import("vue").App }) {
    app.component("Demo", Demo);
  },
};
