import { Ref, ref } from "../reactivity/index";

/**
 * Generic state of a Store
 */
export type StateTree = Record<string | number | symbol, any>;

export type _Method = (...args: any[]) => any;
export type _ActionsTree = Record<string, _Method>;

export type _GettersTree = Record<string, () => any>;

export interface StoreGeneric {
  state: StateTree;
  actions: _ActionsTree;
  getters: _GettersTree;
}

export interface Store {
  /**
   * root state
   */
  state: Ref<Record<string, StateTree>>;

  /**
   * Registry of stores used by this pinia.
   *
   * @internal
   */
  store: Map<string, any>;
}

export function createRootStore(): Store {
  return {
    state: ref({}),
    store: new Map(),
  };
}

export const root = createRootStore();

export let activePinia: Store | undefined;
