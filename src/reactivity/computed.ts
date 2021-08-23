import { effect, trigger, track } from "./effect";
import { Ref } from "./ref";
import { isFunction } from "../shared";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// computed分为只读和可写,可写的用于setter函数

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T;
}
export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: any;
}
export type ComputedGetter<T> = () => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

class ComputedRefImpl<T> {
  private _value: T;
  // 确保effect只会在第一次读取computed的时被调用
  private _dirty: boolean = true;
  public readonly effect: Function;
  public __readonly: boolean = true;

  constructor(
    getter: ComputedGetter<T>,
    readonly setter: ComputedSetter<T>,
    isReadonly: boolean
  ) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        // 依赖追踪只进行一次
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, TriggerOpTypes.SET, "value");
        }
      },
    });
    this.__readonly = isReadonly;
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
    }
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }

  set value(newVal: T) {
    this.setter(newVal);
  }
}

export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
): ComputedRef<T> {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  if (isFunction(getterOrOptions)) {
    // 参数为函数的为只读
    getter = getterOrOptions;
    setter = () => {};
  } else {
    // 参数为对象的为可写
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(
    getter,
    setter,
    isFunction(getterOrOptions) ||
      !(getterOrOptions as WritableComputedOptions<T>).set
  );
}
