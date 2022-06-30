import { defineStore, useState, useMemo } from "../index";

function mock(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(200);
    }, 2000);
  });
}

export const useStore = defineStore("store", () => {
  const [getTextObj, setTextObj] = useState({
    text: "hello",
    text2: "test",
  });

  const setText = async () => {
    const res = await mock();
    setTextObj((s) => {
      s.text2 = res + "";
      return s;
    });
    return res;
  };

  const getAllText = useMemo(() => getTextObj().text + getTextObj().text2);

  return {
    getTextObj,
    setText,
    getAllText,
  };
});
