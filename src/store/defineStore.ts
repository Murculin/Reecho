import { reactive, computed, toRefs } from "../reactivity";
import {
  root,
  StateTree,
  _ActionsTree,
  _GettersTree,
} from "./rootStore";

interface StateFunction {
  (): StateTree;
}

interface StoreConfig {
  state: StateFunction;
  actions?: _ActionsTree;
  getters?: Record<string, () => any>;
}

export function defineStore<T>(id: string, fn: () => T) {
  function useStore() {
    if (!root.store.has(id)) {
      // 初始化
      if (typeof fn === "function") {
        createFunctionStore(id, fn);
      } else {
        // createOptionsStore(id, options);
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

export function createOptionsStore(id: string, options: StoreConfig) {
  // TODO 暂时废弃
  const { state, actions, getters } = options;

  const initialState: StateTree | undefined = root.state.value[id];

  if (!initialState) {
    root.state.value[id] = state ? reactive(state()) : reactive({});
  }

  let computedGetters = {};

  Object.keys(getters).forEach((name) => {
    computedGetters[name] = computed(() => {
      const store = root.store.get(id)!;
      return getters![name].call(store, store);
    });
  });
  let store = { ...state(), ...actions };
  console.log(store, "store");

  const storeProxy = new Proxy(store, {
    get(target, p: any, receiver) {
      if (Reflect.has(state(), p)) {
        // state
        return root.state.value[id][p];
      } else if (Reflect.has(computedGetters, p)) {
        // TODO getters
        return computedGetters[p].value;
      } else {
        // actions
        return target[p];
      }
    },
    set(target, p, value, receiver) {
      if (Reflect.has(state(), p)) {
        root.state.value[id][p] = value;
        return true;
      } else {
        false;
      }
    },
  });

  // const store: StateTree & _ActionsTree & _GettersTree = Object.assign(
  //   root.state.value[id],
  //   actions,
  //   computedGetters
  // );

  root.store.set(id, storeProxy);

  return storeProxy;
}
