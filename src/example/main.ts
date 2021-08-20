import { reactive, ref, effect, h, createApp } from "../index";

const Child =() => {
  return 
}

const App = () => {
  const state = reactive({
    title: "world",
    count: 0,
  });
  const add = () => {
    state.count += 1;
  };
  return () => {
    console.log('render')
    return h("div", null, [
      h("p", null, state.title),
      h("p", { class: "count" }, state.count),

      h(
        "button",
        {
          onClick: () => {
            add();
          },
        },
        "add"
      ),
    ]);
  };
};

createApp(App).mount("#app");
