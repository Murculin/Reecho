import { reactive } from "./reactive";

export function useState<T>(initState: T): [() => T, (val: T) => void] {
  const state = reactive({ value: initState });
  const getState = () => state.value;
  const setState = (newValue: T) => {
    state.value = newValue;
  };
  return [getState, setState];
}
