import { VNode, VNodeTypes } from "./vnode";
import { RendererElement } from "./renderer";
import { isArray } from "../shared/index";

type PropsWithChildren<P> = P & {
  children?: any;
  class?: string;
  className?: string;
};

interface CompontentRenderFuncion {
  (): VNode;
}

export interface Component<P = any> {
  (props: Readonly<PropsWithChildren<P>>): CompontentRenderFuncion;
  componentId?: string | number;
  tag?: any;
}

// 生命周期hook数组
type LifecycleHook<TFn = Function> = TFn[] | null;

export const enum LifecycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
  BEFORE_UNMOUNT = "bum",
  UNMOUNTED = "um",
  RENDER_TRIGGERED = "rtg",
  RENDER_TRACKED = "rtc",
  ERROR_CAPTURED = "ec",
}

export interface ComponentInstance {
  type: VNodeTypes | Component;
  vnode: VNode;
  next: VNode | null;
  props: Record<string, any>;
  parent: any;
  provides: any;
  proxy: any;
  isMounted: boolean;
  isUnmounted: boolean;
  ctx: any; // context 对象
  render?: Function | null;
  update?: Function | null;
  // 子节点
  subTree?: any;
  // 挂载元素
  el?: RendererElement;

  // 生命周期钩子
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook;
  [LifecycleHooks.MOUNTED]: LifecycleHook;
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook;
  [LifecycleHooks.UPDATED]: LifecycleHook;
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook;
  [LifecycleHooks.UNMOUNTED]: LifecycleHook;
}

// 生成组件实例
export const createComponentInstance = (vnode: VNode, parent: any) => {
  const instance: ComponentInstance = {
    type: vnode.type,
    vnode,
    next: null, // 需要更新的 vnode，用于更新 component 类型的组件
    props: {},
    parent,
    provides: parent ? parent.provides : {}, //  获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
    proxy: null,
    isMounted: false,
    isUnmounted: false,
    ctx: {}, // context 对象
    render: null,
    // 生命周期
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
  };

  instance.ctx = {
    _: instance,
  };

  return instance;
};

export function setupComponent(instance: ComponentInstance) {
  const { props } = instance.vnode;
  initProps(instance, props);
  const component = instance.type;
  // 组件函数本身作为setup
  const setup = component as Component;

  setCurrentInstance(instance);
  // 函数组件的执行结果是一个渲染函数
  const renderFunction = setup && setup(instance.props);
  instance.render = renderFunction;
  component.render = renderFunction;
  setCurrentInstance(null);
}

export function initProps(
  instance: ComponentInstance,
  props: Record<string, any>
) {
  // 将组件vnode的children列表注入到props中,这样就可以通过props.children访问
  const children = formatPropsChildren(instance.vnode.children);
  instance.props = { ...props, children };
}

export function formatPropsChildren(children: any): any {
  return isArray(children) && children.length === 1 ? children[0] : children;
}

export let currentInstance: ComponentInstance | null = null;
// 在组件函数中获取组件实例 instance
export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance: ComponentInstance) {
  currentInstance = instance;
}

export function shouldComponentUpdate(
  p1: PropsWithChildren<Record<string, any>>,
  p2: PropsWithChildren<Record<string, any>>
) {
  if (p1 === p2) {
    return false;
  }
  if (!p1) {
    return !!p2;
  }
  if (!p2) {
    return true;
  }

  return hasPropsChange(p1, p2);
}

function hasPropsChange(
  p1: PropsWithChildren<Record<string, any>>,
  p2: PropsWithChildren<Record<string, any>>
) {
  const nextKeys = Object.keys(p2);
  const preKeys = Object.keys(p1);

  // propsKey的数量不一样一定需要更新
  if (nextKeys.length !== preKeys.length) {
    return true;
  }

  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (p2[key] !== p1[key]) {
      return true;
    }
  }

  return false;
}

export function updateProps(
  instance: ComponentInstance,
  newProps: Record<string, any>
) {
  for (let key in newProps) {
    if (key === "children") {
      instance.props["children"] = formatPropsChildren(newProps["children"]);
    } else {
      instance.props[key] = newProps[key];
    }
  }
  for (let key in instance.props) {
    if (key !== "children" && newProps[key] === undefined) {
      delete instance.props[key];
    }
  }
}
