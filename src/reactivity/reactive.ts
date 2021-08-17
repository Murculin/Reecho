import { isObject } from "../shared/index";
import { mutableHandlers } from "./baseHandlers";

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, mutableHandlers);
}

// proxyMap管理原对象->代理结果的映射表
const proxyMap = new WeakMap();

function createReactiveObject(target: object, baseHandlers: object) {
  if (!isObject(target)) {
    return target;
  }

  // 代理过的目标不去重复代理
  const exisitingProxy = proxyMap.get(target);
  if (exisitingProxy) {
    return exisitingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

export const enum ReactiveFlags {
  SKIP = "__v_skip",
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

// TODO toRaw 将响应式对象转化为普通对象
// export function toRaw<T>(observed: T): T {
//   return (
//     (observed && toRaw((observed as Target)[ReactiveFlags.RAW])) || observed
//   );
// }
