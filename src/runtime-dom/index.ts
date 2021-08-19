import { nodeOps } from "./nodeOps";
import { isString } from "../shared/index";
import { createRenderer } from "../runtime-core/index";
import { patchProp } from "./patchProp";

const renderOptions = { ...nodeOps };

// 创建专属于DOM平台的渲染器
function ensureRender() {
  return createRenderer({ ...renderOptions, patchProp });
}

export function createApp(rootComponent, rootProps = null) {
  const { createApp, render } = ensureRender();
  const app = createApp(rootComponent);
  const { mount } = app;
  app.mount = function (container: Element | string) {
    if (isString(container)) {
      container = document.querySelector(container);
    }
    // 挂载时清空容器
    container.innerHTML = "";
    mount(container);
  };

  app.render = (vnode, container) => {
    if (isString(container)) {
      container = document.querySelector(container);
    }
    render(vnode, container);
  };

  return app;
}
