import { ShapeFlags } from "src/shared/shapFlags";
import { VNode, VNodeProps } from "./vnode";
import { createAppApI } from "./createAppApi";
import {
  setupComponent,
  createComponentInstance,
  ComponentInstance,
  shouldComponentUpdate,
  updateProps,
} from "./components";
import { effect } from "src/reactivity";
import { isArray, invokeArrayFns } from "src/shared";
import { queueJob, queuePostFlushCb } from "./scheduler";

export interface RendererNode {
  [key: string]: any;
}
export interface RendererElement extends RendererNode {}

export interface RendererOptions<
  HostNode = RendererNode,
  HostElement = RendererElement
> {
  patchProp(
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode<HostNode, HostElement>[]
  ): void;
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void;
  remove(el: HostNode): void;
  createElement(type: string): HostElement;
  createText(text: string): HostNode;
  createComment(text: string): HostNode;
  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;
  parentNode(node: HostNode): HostElement | null;
  nextSibling(node: HostNode): HostNode | null;
}

type PatchFn = (
  n1: VNode | null, // null means this is a mount
  n2: VNode,
  container: RendererElement,
  parant?: any,
  anchor?: RendererNode | null
) => void;

export function createRenderer(options: any): any {
  const { patch } = renderOpsCreater(options);

  const render = (vnode: VNode, container: RendererElement) => {
    const prevVnode = container.vnode;

    if (vnode) {
      // 有新节点 patch
      patch(prevVnode, vnode, container);
      container.vnode = vnode;
    } else if (prevVnode && prevVnode) {
      // 没新节点有旧节点，移除 DOM
      options.remove(prevVnode.el);
      container.vnode = null;
    }
  };

  return {
    render,
    createApp: createAppApI(render),
  };
}

function renderOpsCreater(options: RendererOptions) {
  const {
    insert,
    createElement,
    patchProp,
    remove,
    setText,
    setElementText,
  } = options;

  // 比较并更新两个vnode
  const patch: PatchFn = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null,
    anchor = null
  ) => {
    if (!n1) {
      const { shapeFlag: nextFlags } = n2;
      // 挂载
      if (nextFlags & ShapeFlags.ELEMENT) {
        // 挂载元素

        patchElement(null, n2, container, parentComponent, anchor);
      } else if (nextFlags & ShapeFlags.COMPONENT) {
        // 挂载组件
        patchComponent(null, n2, container, parentComponent, anchor);
      }
    } else {
      const nextFlags = n2?.shapeFlag;
      const prevFlags = n1?.shapeFlag;

      // 更新;
      if (prevFlags !== nextFlags) {
        // 节点类型不同直接替换
        replaceVNode(n1, n2, container, anchor);
      } else if (nextFlags & ShapeFlags.ELEMENT) {
        // 比较元素节点
        patchElement(n1, n2, container, parentComponent, anchor);
      } else if (nextFlags & ShapeFlags.COMPONENT) {
        // TODO 比较组件节点
        patchComponent(n1, n2, container, parentComponent, anchor);
      } else if (nextFlags & ShapeFlags.TEXT_CHILDREN) {
        // 比较文本节点
        patchText(n1, n2);
      }
    }
  };

  // 挂载
  function mount(
    vnode: VNode,
    container: RendererElement,
    parentComponent?: any,
    anchor = null
  ) {
    patch(null, vnode, container, parentComponent, anchor);
  }

  function patchElement(
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null,
    anchor = null
  ) {
    const flag = n2.shapeFlag;
    let el;
    if (n1 === null) {
      // 挂载
      el = createElement(n2.type);
      n2.el = el;
      const props = n2.props;
      if (props) {
        // 如果 props 存在，则遍历
        for (let key in props) {
          patchProp(el, key, null, props[key]);
        }
      }
      // 递归渲染子节点
      const children = n2.children;
      if (flag & ShapeFlags.TEXT_CHILDREN) {
        // 文本子节点
        setElementText(el, children as string);
      } else if (flag & ShapeFlags.ARRAY_CHILDREN) {
        // 数组节点
        for (let i = 0; i < children.length; i++) {
          if (children[i]) {
            mount(children[i] as any, el, parentComponent);
          }
        }
      }
      // 节点插入容器
      insert(el, container, anchor);
    } else {
      if (n1.type !== n2.type) {
        // 标签不同直接替换元素
        replaceVNode(n1, n2, container);
        return;
      }
      el = n2.el = n1.el;
      const p1 = n1.props;
      const p2 = n2.props;
      // 比较props
      // 新增props
      if (p2) {
        for (let key in p2) {
          patchProp(el, key, p1[key], p2[key]);
        }
      }
      // 删除无用的props
      if (p1) {
        for (let key in p1) {
          if (p1[key] && !p2.hasOwnProperty(key)) {
            patchProp(el, key, p1[key], null);
          }
        }
      }
      patchChildren(n1, n2, el, parentComponent);
    }
  }

  const patchText = (n1: VNode, n2: VNode) => {
    const el = (n2.el = n1.el);
    if (n2.children !== n1.children) {
      setText(el, n2.children as string);
    }
  };

  const replaceVNode = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    anchor = null
  ) => {
    if (n2) {
      mount(n2, container, null, n1.el);
    }
    if (n1.shapeFlag & ShapeFlags.COMPONENT) {
      //  卸载组件
      // beforeUnmount
      const { instance } = n1;
      if (instance.bum) {
        invokeArrayFns(instance.bum);
      }
      remove(n1.el);
      // UnMounted
      if (instance.um) {
        invokeArrayFns(instance.um);
      }
    } else {
      remove(n1.el);
    }
  };

  function patchComponent(
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null,
    anchor = null
  ) {
    if (!n1) {
      // 挂载
      // 创建组件实例
      const instance = (n2.instance = createComponentInstance(
        n2,
        parentComponent
      ));
      setupComponent(instance);
      setupRenderEffect(instance, container, n2);
    } else {
      // 更新
      updateComponent(n1, n2, container);
    }
  }

  function setupRenderEffect(
    instance: ComponentInstance,
    container: RendererElement,
    vnode: VNode
  ) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { bm, m } = instance;
          // 首次挂载
          // TODO beforeMounted hooks
          if (bm) {
            invokeArrayFns(bm);
          }
          // 执行渲染函数并保存在实例上
          const subTree = instance.render();
          instance.subTree = subTree;
          instance.isMounted = true;
          mount(subTree, container, instance);
          vnode.el = subTree.el;
          // Mounted hooks
          if (m) {
            // mounted需要在渲染后执行,渲染为异步任务，这里做特殊处理
            queuePostFlushCb(m);
          }
        } else {
          // 非首次
          let { next, bu, u } = instance;

          // beforeUpdate hooks
          if (bu) {
            invokeArrayFns(bu);
          }

          if (next) {
            next.el = vnode.el;
            updateProps(instance, { ...next.props, children: next.children });
          } else {
            next = vnode;
          }
          const nextSubtree = instance.render();
          const prevSubTree = instance.subTree;
          instance.subTree = nextSubtree;
          patch(prevSubTree, nextSubtree, prevSubTree.el, instance);

          // Updated hooks
          if (u) {
            queuePostFlushCb(u);
          }
        }
      },
      {
        scheduler: (job) => {
          queueJob(job);
        },
      }
    );
  }

  function updateComponent(n1: VNode, n2: VNode, container: RendererElement) {
    if (n1.type !== n2.type) {
      // 组件类型不同直接重新挂载
      replaceVNode(n1, n2, container);
      return;
    }

    // 否则比较props(包括children)
    const instance = (n2.instance = n1.instance);
    const p1 = { ...n1.props, children: n1.children };
    const p2 = { ...n2.props, children: n2.children };
    if (shouldComponentUpdate(p1, p2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  const patchChildren = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null
  ) => {
    let { shapeFlag: prevShapeFlag, children: c1 } = n1;
    let { shapeFlag, children: c2 } = n2;
    // 文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子元素为text,判断前后是否相等，不相等直接更新
      if (c1 !== c2) {
        setElementText(n1.el, c2 as string);
      }
    } else {
      if (!c2 || !c2.length) {
        n2.el.innerHTML = "";
      } else if (isArray(c2)) {
        if (!isArray(c1)) {
          c2.forEach((child) => {
            if (child !== null && child !== undefined) {
              mount(child, container, parentComponent);
            }
          });
          return;
        }
        // 双端比较
        let oldStartIdx = 0;
        let oldEndIdx = c1.length - 1;
        let newStartIdx = 0;
        let newEndIdx = c2.length - 1;

        let oldStartVNode = c1[oldStartIdx];
        let oldEndVNode = c1[oldEndIdx];
        let newStartVNode = c2[newStartIdx];
        let newEndVNode = c2[newEndIdx];

        // 指针交汇前循环执行
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
          if (!oldStartVNode) {
            oldStartVNode = c1[++oldStartIdx];
          } else if (!oldEndVNode) {
            oldEndVNode = c1[--oldEndIdx];
          } else if (oldStartVNode.key === newStartVNode.key) {
            // 1：头头比较
            patch(oldStartVNode, newStartVNode, container);
            oldStartVNode = c1[++oldStartIdx];
            newStartVNode = c2[++newStartIdx];
          } else if (oldEndVNode.key === newEndVNode.key) {
            // 2： 尾尾比较
            patch(oldEndVNode, newEndVNode, container);
            oldEndVNode = c1[--oldEndIdx];
            newEndVNode = c2[--newEndIdx];
          } else if (oldStartVNode.key === newEndVNode.key) {
            // 3: 头尾比较
            patch(oldStartVNode, newEndVNode, container);
            container.insertBefore(
              oldStartVNode.el,
              oldEndVNode.el.nextSibling
            );
            // 更新索引，指向下一个位置
            oldStartVNode = c1[++oldStartIdx];
            newEndVNode = c2[--newEndIdx];
          } else if (oldEndVNode.key === newStartVNode.key) {
            // 4: 尾头比较
            patch(oldEndVNode, newStartVNode, container);
            container.insertBefore(oldEndVNode.el, oldStartVNode.el);
            oldEndVNode = c1[--oldEndIdx];
            newStartVNode = c2[++newStartIdx];
          } else {
            // 5: 比较失败 遍历旧 children，试图寻找与 newStartVNode 拥有相同 key 值的元素
            const index = c1.findIndex(
              (node) => node.key === newStartVNode.key
            );
            if (index > 0) {
              // 找到了，则这个节点需要被移动
              const vnodeToMove = c1[index];
              // 调用 patch 函数完成更新
              patch(vnodeToMove, newStartVNode, container);
              // 把 vnodeToMove.el 移动到最前面，即 oldStartVNode.el 的前面
              container.insertBefore(vnodeToMove.el, oldStartVNode.el);
              // 由于旧 children 中该位置的节点所对应的真实 DOM 已经被移动，所以将其设置为 undefined
              c1[index] = undefined;
            } else {
              // 没找到就挂载新节点
              mount(newStartVNode, container, oldStartVNode.el);
            }
            // 将 newStartIdx 下移一位
            newStartVNode = c2[++newStartIdx];
          }

          if (oldEndIdx < oldStartIdx) {
            // 添加新节点
            for (let i = newStartIdx; i <= newEndIdx; i++) {
              mount(c2[i], container);
            }
          } else if (newEndIdx < newStartIdx) {
            // 移除操作
            for (let i = oldStartIdx; i <= oldEndIdx; i++) {
              replaceVNode(c1[i], null, container);
            }
          }
        }
      }
    }
    // 元素
    // 组件
  };

  return {
    mount,
    patch,
  };
}
