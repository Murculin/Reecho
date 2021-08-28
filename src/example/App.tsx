import { reactive, computed, h, Component, provide } from "../index";

import Child from "./Child";
import { createStore, store } from "./store/index";

const App: Component = () => {
  const store = createStore();

  const state = reactive({
    title: "world",
    count: 0,
    list: [{id: -1}],
  });
  const add = () => {
    state.count += 1;
    store.addListItem();
    // state.list.push({ id: state.count });
  };
  const showEndText = computed(() => {
    return state.count > 3;
  });

  return () => {
    return (
      <div>
        <h1>Test</h1>
        <Child count={state.count}></Child>
        {showEndText.value && <p>end</p>}
        <button onClick={add}>add</button>
        <ul>
          {state.list.map((item) => (
            <li key={item.id}>{item.id}</li>
          ))}
        </ul>
      </div>
    );
  };
};

export default App;
