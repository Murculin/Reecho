import { h, Component } from "../index";
import { useStore, increment } from "./store";

const Emit: Component = () => {
  const [_, dispatch] = useStore();

  return () => (
    <div>
      <button onClick={() => dispatch(increment())}>increase</button>
    </div>
  );
};

export default Emit;
