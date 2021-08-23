import {
  reactive,
  ref,
  effect,
  computed,
  h,
  createApp,
  Component,
  onMounted,
} from "../index";

interface ChildProps {
  count: number;
}

const Child: Component<ChildProps> = (props) => {
  onMounted(() => {
    console.log("childMount");
  });

  return () => {
    // console.log("child render");
    return h("div", null, [h("div", null, props.count), props.children]);
  };
};

const App: Component = () => {
  const state = reactive({
    title: "world",
    count: 0,
  });
  const add = () => {
    state.count += 1;
  };
  const showChild = computed(() => {
    return state.count < 3;
  });

  return () => {
    // console.log("render", showChild.value);
    return h("div", null, [
      h("p", null, state.title),
      showChild.value
        ? h(Child, { count: state.count }, [h('div', null, 'slot')])
        : h("div", null, "end"),
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
