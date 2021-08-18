import { isObject, hasChanged, isArray } from "../shared/index";
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
