import { getCurrentInstance } from "./components";
import { isFunction } from "../shared/index";

export interface InjectionKey<T> extends Symbol {}

export function provide<T>(key: InjectionKey<T> | string | number, value: T) {
  const currentInstance = getCurrentInstance();
  if (!currentInstance) {
    return;
  }
  let { provides } = currentInstance;
  const parentProvides = currentInstance.parent?.provides;
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  provides[key as any] = value;
}

export function inject<T = any>(
  key: InjectionKey<T> | string,
  defaultValue?: T
): T {
  const currentInstance = getCurrentInstance();

  if (currentInstance) {
    const provides = currentInstance.parent?.provides;
    if (provides && (key as string) in provides) {
      return provides[key as string];
    } else if (defaultValue) {
      if (isFunction(defaultValue)) {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
