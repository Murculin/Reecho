import { isArray } from "./../shared/index";
import { isObject, hasChanged } from "../shared/index";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";
import { TriggerOpTypes, TrackOpTypes } from "./operations";

export interface Ref<T = any> {
  value: T;
  _shallow?: boolean;
}

function convert<T extends unknown>(value: T) {
  return isObject(value) ? reactive(value as any) : value;
}

class RefImpl<T> {
  public _value: T;
  public _isRef: boolean = true;
  constructor(private rawValue: T, public readonly shallow: boolean) {
    // shallow时只代理第一层
    this._value = shallow ? rawValue : convert<T>(rawValue);
  }

  get value() {
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }

  set value(newVal) {
    if (hasChanged(newVal, this.rawValue)) {
      this.rawValue = newVal;
      this._value = newVal;
      trigger(this, TriggerOpTypes.SET, "value", newVal);
    }
  }
}

function createRef(rawValue: unknown, shallow: boolean): Ref {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

export function ref<T>(value: T): Ref<T> {
  return createRef(value, false);
}

export function shallowRef<T>(value: T): Ref<T> {
  return createRef(value, true);
}

export function isRef(target: any): target is Ref {
  return target && target._isRef === true;
}

// 非响应性代理
class ObjectRefImpl {
  public _isRef = true;
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }

  set value(newVal) {
    this.target[this.key] = newVal;
  }
}

export function toRef(target, key): Ref {
  return new ObjectRefImpl(target, key);
}


export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
export type ToRef<T> = IfAny<T, Ref<T>, [T] extends [Ref] ? T : Ref<T>>

export type ToRefs<T = any> = {
  [K in keyof T]: ToRef<T[K]>;
};
export function toRefs<T extends object>(object: T): ToRefs<T> {
  const ret: any = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

