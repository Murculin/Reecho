/**
 * @description: 工具函数
 */

export const isObject = (val: unknown): val is Record<any, any> =>
  typeof val === "object" && val !== null;
export const extend = Object.assign;
export const isArray = Array.isArray;
export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";
export const isNumber = (val: unknown): val is number =>
  typeof val === "number";
export const isString = (val: unknown): val is string =>
  typeof val === "string";
export const isIntegerKey = (key: unknown) =>
  parseInt(key as string) + "" === key;
export const isSymbol = (val: unknown) => typeof val === "symbol";

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

let hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target: object, key: unknown) =>
  hasOwnProperty.call(target, key);
export const hasChanged = (oldValue: unknown, value: unknown) =>
  oldValue !== value;
export const NOOP = () => {};

// 执行数组中的函数
export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
