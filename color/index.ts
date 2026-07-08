import dark from "./dark";
import light from "./default";
import blue from "./blue";
import red from "./red";
import pink from "./pink";
import green from "./green";
import orange from "./orange";
import purple from "./purple";

export const themeColors = {
  green,
  orange,
  purple,
  blue,
  red,
  pink,
  dark,
  light,
};

export default (
  theme: "dark" | "light",
  color: "red" | "pink" | "blue" | "green" | "orange" | "purple" = "blue"
) => {
  const themeColor = themeColors[color];
  if (themeColor) {
    document.documentElement.style.setProperty(
      "--soui-brand-6",
      themeColor["Brand-6"]
    );
    (window as any).Shineout?.setToken?.({
      selector: "html",
      token: {
        ...(theme === "dark" ? dark : light),
        ...themeColor,
        "Brand-1":
          theme === "dark"
            ? themeColor["Brand-1"] + "00"
            : themeColor["Brand-1"],
      },
    });
    if (theme === "dark") {
      document.documentElement.style.setProperty("color-scheme", "dark");
    } else {
      document.documentElement.style.removeProperty("color-scheme");
    }
    return themeColor["Brand-6"];
  }
};
