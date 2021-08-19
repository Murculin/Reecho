import { reactive, ref, effect } from "../index";

const app = document.getElementById("app");

const state = reactive({
  name: "bob",
  age: 18,
});

const slogan = ref("hello");

effect(() => {
	console.log(state);
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
