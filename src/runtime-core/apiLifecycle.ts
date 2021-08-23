import {
  setCurrentInstance,
  currentInstance,
  ComponentInstance,
} from "./components";
import { isFunction, isPromise } from "../shared";


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

export const injectLifeCycleHook = <T extends Function = () => {}>(
  type: LifecycleHooks,
  hook: T,
  target: ComponentInstance | null = currentInstance
) => {
  if (target) {
    let hooks: Function[];
    // 将生命周期绑定在组件实例上
    if (target[type]) {
      hooks = target[type];
    } else {
      hooks = target[type] = [];
    }
    const wrappedHook = (...args: unknown[]) => {
      // TODO 考虑在effect中调用生命周期钩子的情况，需要暂停依赖收集

      setCurrentInstance(target);
      // 执行传入的hook函数并捕获错误
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      setCurrentInstance(null);

      return res;
    };

    hooks.push(wrappedHook);

    return wrappedHook;
  }
};

export const createHook = <T extends Function = () => {} | void>(
  lifecycle: LifecycleHooks
) => (hook: T, target: ComponentInstance | null = currentInstance) =>
  injectLifeCycleHook(lifecycle, hook, target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED);

// 异步错误捕获
const callWithAsyncErrorHandling = (
  fn: Function | Function[],
  instance: ComponentInstance | null,
  type: any,
  args: any[]
): any[] => {
  if (isFunction(fn)) {
    // 传入一个函数
    let res: any;
    try {
      res = args ? fn(...args) : fn();
      if (res && isPromise(res)) {
        // 说明是异步的
        res.catch((err) => {
          handleError(err);
        });
      }
    } catch (err) {
      handleError(err);
    }
    return res;
  } else {
    // 传入函数数组
    let ret = [];
    for (let i = 0; i < fn.length; i++) {
      const f = fn[i];
      ret.push(callWithAsyncErrorHandling(f, instance, type, args));
    }
    return ret;
  }
};

// 错误处理函数
const handleError = (err: Error) => {
  throw err;
};
