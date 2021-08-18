/* 
  effect：只有在effect函数中的响应式属性才会被收集依赖
  track：track函数会让当前属性收集effect
  trigger：找到属性对应的effect，并执行
*/

import { isArray } from "../shared";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// Dep为effect列表
type Dep = Set<ReactiveEffect>;
// key -> effect列表的映射关系
type KeyToDepMap = Map<any, Dep>;

export interface ReactiveEffect<T = any> {
  (): T;
  _isEffect: boolean;
  id: number;
  active: boolean;
  // 存储effect的第一个函数参数
  raw: () => T;
  // 依赖列表
  deps: Array<Dep>;
  options: ReactiveEffectOptions;
  // allowRecurse: boolean;
}

export interface ReactiveEffectOptions {
  // 是否在调用时自动执行参数函数
  lazy?: boolean;
  // 调度器，控制effct会的执行时机
  scheduler?: (job: ReactiveEffect) => void;
}

export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = {}
): ReactiveEffect<T> {
  const effect = createReactiveEffect(fn, options);

  if (!options.lazy) {
    effect();
  }

  return effect;
}

// 记录当前的effect
let activeEffect;
let uid = 0;
// 存储effect的栈结构,用来处理effect多层嵌套调用的情况
const effectStack = [];

function createReactiveEffect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function () {
    // 控制effectStack中没有当前effect才会执行，防止effect递归执行变成死循环
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(activeEffect);
        return fn();
      } finally {
        // 保证activeEffect在嵌套调用时永远指向栈顶
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++;
  effect.deps = []; //effect的依赖列表
  effect.options = options;
  effect.raw = fn;
  effect._isEffect = true;
  effect.active = true;
  return effect;
}

// !!!将属性和effect双向关联!!!
// track的目的是形成类似{target: {key: [effect1, effect2]}} 的结构
let targetMap = new WeakMap<any, KeyToDepMap>();

// 收集依赖 在getter时调用
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (activeEffect == undefined) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep); //双向记忆,构建activeEffect的依赖数组
  }
}

// 触发更新 在setter时调用
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  value?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  const runEach = (effect: any) => {
    // 对于有调度器的effect,优先执行调度器函数
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };

  const run = (effects: any) => {
    if (effects) {
      effects.forEach((effect) => {
        runEach(effect);
      });
    }
  };

  if (key === "length" && isArray(target)) {
    // 处理直接修改数组length的情况 ex: a = [1,2] a.length = 5, 此时key为'length'
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= value) {
        run(dep);
      }
    });
  } else {
    // 对象/数组正常key的处理
    if (key != undefined) {
      // 说明修改了key
      run(depsMap.get(key));
    }
    // TODO 处理操作数组本不存在的key的情况 ex: a = [1,2,3] a[5] = 5
  }
}
