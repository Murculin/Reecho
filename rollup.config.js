import path from "path";
import resolve from "@rollup/plugin-node-resolve"; // 依赖引用插件
import ts from "rollup-plugin-typescript2";
import serve from "rollup-plugin-serve";
import replace from "@rollup/plugin-replace";
import clear from "rollup-plugin-clear";

import css from "rollup-plugin-css-only";

export default {
  input: "src/index.ts",
  output: {
    // name: "Eff",
    format: "esm",
    file: path.resolve("dist/index.js"),
    sourcemap: true,
  },
  plugins: [

    resolve({
      extensions: [".js", ".ts", ".tsx", ".jsx"],
    }),
    ts({
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
    }),

    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
    }),

    css({ output: "bundle.css" }),

    serve({
      open: true,
      openPage: "/public/index.html",
      port: 3000,
      contentBase: "",
    }),

    clear({ targets: ["dist"] }), //清除build目录
  ],
};
