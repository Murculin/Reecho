import { reactive, ref, effect } from "../index";

const app = document.getElementById("app");

const state = reactive({
  name: "bob",
  age: 18,
});

const slogan = ref("hello");

effect(() => {
  app.innerHTML = state.age + "";
});

effect(() => {
  const spanEle = document.createElement("span");
  spanEle.innerHTML = slogan.value;
  app.appendChild(spanEle);
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
