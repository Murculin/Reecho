import {
  useState,
  useEffect,
  h,
  Component,
  onBeforeUpdate,
  produce,
} from "../index";
import { useStore } from "./useStore";

interface ChildProps {
  text: string;
}
const Child: Component<ChildProps> = (props) => {
  return () => <div style={{ backgroundColor: "red" }}>{props.text}</div>;
};

const App: Component = () => {
  const { getTextObj, setText, getAllText } = useStore();

  const [info, setInfo] = useState({
    title: "Hello",
    desc: "Reecho",
  });

  const setDesc = () => {
    setInfo((s) => {
      s.title = "a";
      return s;
    });
    console.log(info());
  };

  onBeforeUpdate(() => {
    console.log("beforeUpdate");
  });

  useEffect(() => {
    console.log("setTitle");
    document.title = info().title;
  });

  return () => {
    return (
      <div>
        <button onClick={setDesc}>setTitle</button>
        <p>{info().title}</p>
        <p>{getAllText()}</p>
        <Child text={info().desc}></Child>
      </div>
    );
  };
};

export default App;
