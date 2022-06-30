import { isObject } from "./../shared/index";
import { isFunction } from "src/shared";
import { ref } from "./ref";

interface FunctionSetState<T> {
  (prev: T): T;
  __isProduce: boolean | undefined;
}

export function useState<T>(
  initState: T
): [() => T, (val: T | ((prev: T) => T)) => void] {
  const state = ref(initState);
  const getState = () => state.value;

  function setState(valueOrFn: T | FunctionSetState<T>) {
    if (isFunction(valueOrFn)) {
      if (valueOrFn.__isProduce) {
        // TODO
        if (!isObject(state.value)) {
          throw new Error("produce must be used in object state");
        } else {
          state.value = valueOrFn(state.value);
        }
      } else {
        state.value = valueOrFn(state.value);
      }
    } else {
      state.value = valueOrFn;
    }
  }
  return [getState, setState];
}

export function produce<T>(fn: (state: T) => void): (prev: T) => T {
  const retFn = (state: T) => {
    fn(state);
    return {...state};
  };
  retFn.__isProduce = true;
  return retFn;
}

/*
setState(produce(s => {
  s.a = 1
}))

*/
