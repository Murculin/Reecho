import { reactive } from "../reactivity";

interface Mutation<T = any> {
  (state: T, action: Action): void;
}

interface RootOptions {
  modules: Record<string, Slice>;
}

interface SliceOptions<
  T extends object,
  P extends Record<string, Mutation<T>>
> {
  name: string;
  initialState: T;
  mutations: P;
  modules?: Record<string, Slice>;
}

interface Slice {
  actions: Record<string, ActionCreator>;
  mutations: Record<string, Mutation>;
  name: string;
  getState: () => object;
}

export function createSlice<
  T extends object,
  P extends Record<string, Mutation<T>>
>(options: SliceOptions<T, P>) {
  const { name = "", initialState, mutations } = options;
  const state = reactive(initialState);
  const actions = getActions(mutations, name);
  const getState = () => state;
  let sliceMutations: any = {};
  for (let key in mutations) {
    const sliceKey = name ? name + "/" + key : key;
    sliceMutations[sliceKey] = mutations[key];
  }
  return {
    name,
    getState,
    actions,
    mutations: sliceMutations,
  };
}

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export interface ActionCreator<T = any> {
  (payload?: T): Action<T>;
}

export function getActions<T extends Record<string, Function>>(
  mutations: T,
  name: string
): Partial<Record<keyof T, ActionCreator>> {
  let actions: Partial<Record<keyof T, ActionCreator>> = {};
  for (let key in mutations) {
    const actionsCreator: ActionCreator = (payload) => ({
      type: name ? name + "/" + key : key,
      payload: payload,
    });
    actions[key] = actionsCreator;
  }
  return actions;
}

export function createStore(options: RootOptions) {
  const { modules } = options;
  let state = reactive({});
  let mutations = {};
  for (let key in modules) {
    const { name, getState, mutations: ModulesMutations } = modules[key];
    state[name] = getState();
    mutations = { ...mutations, ...ModulesMutations };
  }

  const dispatch = (action: Action) => {
    const { type } = action;
    const path = type.split("/");
    let sliceState = state;
    path.forEach((item, index) => {
      if (index < path.length - 1) {
        sliceState = sliceState[item];
      }
    });
    const fn = mutations[type];
    return fn(sliceState, action);
  };

  return {
    state,
    mutations,
    dispatch,
  };
}
