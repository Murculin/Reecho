import { inject } from "../../index";
import { createSlice, Action, createStore } from "../../store/createSlice";

const countSlice = createSlice({
  name: "count",
  initialState: {
    count: 1,
  },
  mutations: {
    increment: (state) => {
      console.log("increment", state);
      state.count += 1;
    },
    setCount: (state, action: Action<number>) => {
      state.count = action.payload;
    },
  },
});

export const { increment } = countSlice.actions;

const textSlice = createSlice({
  name: "text",
  initialState: {
    text: "Hello",
  },
  mutations: {
    setText(state, actions: Action<string>) {
      state.text = actions.payload;
    },
  },
});

export const { setText } = textSlice.actions;

export const store = createStore({
  modules: {
    countSlice,
    textSlice,
  },
});

export function useStore() {
  const store = inject("store");
  console.log("state", store.state);
  return [store.state, store.dispatch];
}

const dispatch = store.dispatch;
dispatch(increment());
dispatch(setText("World"));

console.log("store", store);
