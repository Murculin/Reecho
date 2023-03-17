# Reecho
## 简介
Reecho 是一款基于依赖收集的MVVM框架，它具有以下特点
- 声明式数据： 基于proxy的依赖收集
- 使用函数定义组件，但组件不会如React一样重复执行造成心智负担
- 读写分离，读取状态和更改状态统一使用函数，避免vue3的ref一样有时需要`xxx.value`有时不需要的不一致性
- 使用TS编写，类型友好

## 语法介绍

### 组件
- 使用函数定义组件,`Component`用来标记类型，其泛型参数是组件props的类型
- 与`React`不同，组件函数本身*只会在组件挂载时执行一次*
- 组件函数需要返回一个函数，返回值函数才会在状态改变时多次执行

```ts
import { h, Component } from "reecho";

interface ChildProps {
  text: string;
}
const Child: Component<ChildProps> = (props) => {
  return () => <div>{props.text}</div>;
};
```

### 挂载到DOM
```ts
import { createApp } from "reecho";
import App from "./App";

createApp(App).mount("#app");
```

### 声明状态
- 使用`useState`声明状态
- `useState`返回`getState`和`setState`两个函数，分别用来读取和更改状态
- `Reecho`中的`useState`时基于`proxy`实现的，为避免使用`xxx.value`这样的写法对开发者造成困扰，读取状态使用了函数
- 当状态改变时，依赖该状态的部分会被更新
```ts
import { useState } from "reecho";
const App: Component = () => {
  const [getInfo, setInfo] = useState('Hello');
  return () => {
    return (
      <div>
        <p>{getInfo()}</p>
        <button onClick={() => setInfo('World')}>setInfo</button>
      </div>
    );
  };
};
```

### 生命周期
和`Vue`与`React`一样，组件拥有自己的生命周期
生命周期包括: onBeforeMount, onMounted, onBeforeUpdate,onUpdated,onBeforeUnmount,onUnmounted
```ts
import { h, Component, onMounted } from "reecho";
const App: Component = () => {
  onMounted(() => {
    // 在挂载后执行
  })
  onBeforeUpdate(() => {
    // 每次组件更新前执行
  });
  return () => {
    return (
      <div>
        Hello World
      </div>
    );
  };
};

```

### 副作用
- 使用`useEffect`可以在状态更新后执行副作用
- 自动收集依赖，不需要收到传入依赖数组
```ts
import { h, Component, useEffect, useState } from "reecho";
const App: Component = () => {
  const [getCount, setCount] = useState(0)
  useEffect(() => {
    // 每次count改变时执行
    console.log(getCount())
  })
  return () => {
    return (
      <div>
        Hello World
      </div>
    );
  };
};
```

### Store
- `Reecho`自带简单的全局状态管理
- 使用`defineStore`,第一个参数为Key,第二个参数传入自定义hook函数即可
- 定义时
```ts
import { defineStore, useState } from "../index";

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
  });

  const setText = async () => {
    const res = await mock();
    setTextObj((s) => {
      s.text = res + "";
      return s;
    });
    return res;
  };

  return {
    getTextObj,
    setText,
  };
});
```
- 使用时
```ts
import { Component } from 'reecho'
import { useStore } from "./useStore";
const App:Component = () => {
  const {getTextObj} = useStore()

  return () => (
    <div>{getTextObj().text}</div>
  )
}
```