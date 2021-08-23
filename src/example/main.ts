import {
  reactive,
  ref,
  effect,
  computed,
  h,
  createApp,
  Component,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
} from "../index";

interface ChildProps {
  count: number;
}

const Child: Component<ChildProps> = (props) => {
  onBeforeMount(() => {
    console.log("onBeforeMount");
  });
  onMounted(() => {
    console.log("onMounted1");
  });
  onMounted(() => {
    console.log("onMounted2");
  });
  onBeforeUpdate(() => {
    console.log("onBeforeUpdate");
  });
  onUpdated(() => {
    console.log("onUpdated");
  });
  onBeforeUnmount(() => {
    console.log("onBeforeUnmount");
  });
  onUnmounted(() => {
    console.log("onUnmounted");
  });

  return () => {
    console.log("child render");
    return h("div", null, props.count);
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
    console.log("render", showChild.value);
    return h("div", null, [
      h("p", null, state.title),
      showChild.value ? h(Child, { count: state.count }) : "",
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
