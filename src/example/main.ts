import { reactive, ref, effect, h } from "../index";

const app = document.getElementById("app");

const vNode = h("div", null, [h("p", { class: "p" }, "test")]);
console.log(vNode);

const state = reactive({
  name: "bob",
  age: 18,
});

const slogan = ref("hello");

effect(() => {
  app.innerHTML = state.age + "";
});

function addAge() {
  state.age += 1;
  if (state.age >= 24) {
    slogan.value = "world";
  }
}

setInterval(() => {
  addAge();
}, 1000);
