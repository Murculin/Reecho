import {
  root,
  _ActionsTree,
  _GettersTree,
} from "./rootStore";


export function defineStore<T>(id: string, fn: () => T) {
  function useStore() {
    if (!root.store.has(id)) {
      // 初始化
      if (typeof fn === "function") {
        createFunctionStore(id, fn);
      }
    }
    const store: T = root.store.get(id)!;

    return store;
  }
  useStore.$id = id;
  return useStore;
}

export function createFunctionStore(id: string, setup) {
  const store = setup();
  root.store.set(id, store);
}
