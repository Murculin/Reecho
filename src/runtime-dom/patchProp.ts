import { isArray, isObject, isString } from "../shared";

// 需要当作 DOM Prop 处理的属性
const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/;

export const patchProp = (
  el: Element,
  key: string,
  preValue: any,
  nextValue: any
): void => {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "className":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, preValue, nextValue);
      break;
    default:
      if (key[0] === "o" && key[1] === "n") {
        // on开头视作事件
        key = key.toLowerCase();
        if (preValue) {
          el.removeEventListener(key.slice(2), preValue);
        }
        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue);
        }
      } else if (domPropsRE.test(key)) {
        el[key] = nextValue;
      } else {
        if (key !== "children") {
          patchAttr(el, key, nextValue);
        }
      }
      break;
  }
};

function patchClass(el: Element, value: unknown) {
  if (value === null) {
    value = "";
  } else if (isString(value)) {
    value = "" + value;
  } else if (isArray(value)) {
    value = value.reduce((pre, current) => {
      return pre + " " + current;
    }, "");
  } else if (isObject(value)) {
    value = "";
    for (let key in value as object) {
      if (value[key]) {
        value = value + " " + key;
      }
    }
  }
  el.className = String(value);
}

type Style = string | Record<string, string | string[]> | null;

function patchStyle(el: Element, pre: Style, next: Style) {
  const style = (el as HTMLElement).style;
  if (!next) {
    el.removeAttribute("style");
  } else if (isString(next)) {
    if (pre !== next) {
      style.cssText = next;
    }
  } else {
    // style是对象或数组
    for (const key in next) {
      setStyle(style, key, next[key]);
    }
    if (pre && !isString(pre)) {
      for (const key in pre) {
        if (next[key] == null) {
          // 把next中没有但prev中有的属性删除
          setStyle(style, key, "");
        }
      }
    }
  }
}

function setStyle(
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) {
  if (isArray(val)) {
    // 如果style是数组，递归添加到标签的style属性中
    val.forEach((v) => setStyle(style, name, v));
  } else {
    style[name] = val;
  }
}

function patchAttr(el: Element, key: string, value: any) {
  if (value === null) {
    el.removeAttribute(key);
  } else if (value !== "props") {
    el.setAttribute(key, value);
  }
}
