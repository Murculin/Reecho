import {
  hasChanged,
  isObject,
  isSymbol,
  isArray,
  isIntegerKey,
  hasOwn,
} from "../shared/index";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

const mutableHandlers = {
  get: (target: object, key: string | symbol, receiver: object) => {
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key)) {
      return res;
    }
    track(target, TrackOpTypes.GET, key);

    // 懒递归，触发相应get才会生成proxy
    if (isObject(res)) {
      reactive(res);
    }

    return res;
  },
  set: (
    target: object,
    key: string | symbol,
    value: any,
    receiver: object
  ): boolean => {
    const oldValue = target[key];
    // 判断对数组/对象的操作是新增还是删除
    // 通过push pop splice等方法改变数组也可以判断
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const res = Reflect.set(target, key, value, receiver);

    if (!hadKey) {
      // 新增属性
      trigger(target, TriggerOpTypes.ADD, key, value);
    } else if (hasChanged(value, oldValue)) {
      // 修改属性
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
    }

    return res;
  },
};

export function reactive<T extends object>(target: T): T {
  return createReactiveObject<T>(target, mutableHandlers);
}

const proxyMap = new WeakMap();

function createReactiveObject<T extends object>(target: T, handlers): T {
  if (!isObject(target)) {
    return;
  }
  let proxy = proxyMap.get(target);
  if (proxy) {
    return proxy;
  }
  proxy = new Proxy(target, handlers);
  proxyMap.set(target, proxy);

  return proxy;
}
