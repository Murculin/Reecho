import { reactive, inject, provide } from "../../index";

interface ListItem {
  id: number;
  text?: string | number;
}

interface State {
  list: ListItem[];
}

interface SliceData<T> {
  state: T;
  actions?: Function[];
  getters?: Function[];
}

function createSlice<T extends object>(
  nameSpace: string | Symbol,
  data: SliceData<T>
) {
  let { state, actions } = data;
  function withActions(fn: Function) {
    return (...args) => fn(data, ...arguments);
  }

  return {
    state: reactive(state),
  };
}

export const store = {
  state: reactive({
    list: [{ id: 0 }],
    age: 18,
  }),
  addListItem() {
    const list = [...this.state.list];
    list.push({ id: list.length });
    this.state.list = list;
  },
  addAge() {
    this.state.age += 1;
  },
};

export type Store = typeof store;

export const createStore = () => {
  provide("store", store);
  return store;
};

export const useStore = (nameSpace: string | Symbol = "store"): Store => {
  const store: Store = inject(nameSpace);
  return store;
};
