import { h, Component } from "../index";
import { useStore } from "./store";

const Recieve: Component = () => {
  const [state] = useStore();

  return () => (
    <div>
      <h2>store</h2>
      <p>{state.count.count}</p>
    </div>
  );
};

export default Recieve;
