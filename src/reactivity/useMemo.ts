import { computed } from "./computed";


export function useMemo<T>(fn: () => T): () => T {
  const ref = computed(fn);
  function getValue() {
    return ref.value;
  }
  return getValue;
}
