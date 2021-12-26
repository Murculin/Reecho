import { useState, useEffect, h, Component } from "../index";
import { onBeforeUpdate } from "../index";

const App: Component = () => {
  const [getCount, setCount] = useState(1);

  const [info, setInfo] = useState({
    title: "test title",
    desc: "Hi",
  });

  const add = () => {
    setCount(getCount() + 1);
  };

  const setDesc = () => {
    setInfo({ ...info(), desc: "Reecho" });
  };

  onBeforeUpdate(() => {
    console.log("beforeUpdate");
  });

  useEffect(() => {
    console.log("setTitle");
    document.title = info().desc;
  });

  return () => {
    return (
      <div>
        <button onClick={setDesc}>setTitle</button>
        <button onClick={add}>add</button>
        <div>{"count:" + getCount()}</div>
        <h1>{info().title}</h1>
        <p>{info().desc}</p>
      </div>
    );
  };
};

export default App;
