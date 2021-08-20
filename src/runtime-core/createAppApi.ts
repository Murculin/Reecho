import { createVNode } from "./vnode";
import { isObject } from "../shared";

export interface AppContext {
  app: any;
  provides: any;
}

export function createAppContext(): AppContext {
  return {
    app: null as any, // 刚创建时为空
    provides: Object.create(null),
  };
}

export function createAppApI(render) {
  return (rootComponent, rootProps = null) => {
    // 检验root props必须是对象
    if (rootProps != null && !isObject(rootProps)) {
      console.log(`root props passed to app.mount() must be an object.`);
      rootProps = null;
    }

    const context = createAppContext(); // 创建context

    const app = {
      _props: rootProps, // 属性
      _component: rootComponent, // 组件
      _container: null,
      mount(rootContainer) {
        // 1.通过rootComponent 创建vnode
        // 2.调用render方法将vnode渲染到rootContainer中
        const vnode = createVNode(rootComponent, rootProps);
        vnode.appContext = context; // 保存context在根节点上
        render(vnode, rootContainer);
        app._container = rootContainer;
      },
    };
    return app;
  };
}
