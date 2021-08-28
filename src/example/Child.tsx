import { h, Component, onMounted, inject } from "../index";
import { useStore } from "./store";

interface ChildProps {
  count: number;
}

const GarandChild: Component = () => {
  const store = useStore();

  return () => {
    console.log('GarandChild', store.state)
    return (
      <ul>
        {store.state.list.map((item) => (
          <li key={item.id}>{item.id}</li>
        ))}
      </ul>
    );
  };
};

const Child: Component<ChildProps> = (props) => {
  onMounted(() => {
    console.log("childMount");
  });

  return () => {
    // console.log("child render");
    return (
      <div>
        <p>{"count:" + props.count}</p>
        <GarandChild></GarandChild>
      </div>
    );
  };
};

export default Child;
