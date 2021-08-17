import {
  isSymbol,
  isObject,
  isArray,
  isIntegerKey,
  hasOwn,
  hasChanged,
} from "../shared/index";
import { reactive, Target } from "./reactive";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// 通过工厂函数创建getter和setter
function createGetter() {
  return function get(target: Target, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver);

    // 若key为symbol,则不做任何操作,避免改变js原生对象中的内置属性
    if (isSymbol(key)) {
      return res;
    }

    // 依赖收集
    track(target, TrackOpTypes.GET, key);

    // 是对象则递归代理
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  };
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
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
  };
}

const get = createGetter();
const set = createSetter();

export const mutableHandlers = {
  get,
  set,
};
