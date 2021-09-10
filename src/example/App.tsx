import { h, Component, provide } from "../index";
import { store } from "./store/index";
import Recieve from "./Recieve";
import Emit from "./Emit";

const App: Component = () => {
  provide("store", store);
  return () => {
    return (
      <div>
        <h1>Test</h1>
        <Recieve></Recieve>
        <Emit></Emit>
      </div>
    );
  };
};

export default App;
