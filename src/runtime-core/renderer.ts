import { ShapeFlags } from "src/shared/shapFlags";
import { VNode, VNodeProps } from "./vnode";
import { createAppApI } from "./createAppApi";
import {
  setupComponent,
  createComponentInstance,
  ComponentInstance,
  shouldComponentUpdate,
  updateProps,
} from "./compontents";
import { effect } from "src/reactivity";

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
    createText,
    parentNode,
    setText,
    setElementText,
  } = options;
  function mount(
    vnode: VNode,
    container: RendererElement,
    parentComponent?: any
  ) {
    patch(null, vnode, container, parentComponent);
  }

  const patch: PatchFn = (
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null
  ) => {
    if (!n1) {
      const { shapeFlag: nextFlags } = n2;
      // 挂载
      if (nextFlags & ShapeFlags.ELEMENT) {
        // 挂载元素
        patchElement(null, n2, container, parentComponent);
      } else if (nextFlags & ShapeFlags.COMPONENT) {
        // TODO挂载组件
        patchComponent(null, n2, container, parentComponent);
      }
    } else {
      const nextFlags = n2?.shapeFlag;
      const prevFlags = n1?.shapeFlag;

      // 更新;
      if (prevFlags !== nextFlags) {
        // 节点类型不同直接替换
        replaceVNode(n1, n2, container);
      } else if (nextFlags & ShapeFlags.ELEMENT) {
        // 比较元素节点
        patchElement(n1, n2, container, parentComponent);
      } else if (nextFlags & ShapeFlags.COMPONENT) {
        // TODO 比较组件节点
        patchComponent(n1, n2, container, parentComponent);
      } else if (nextFlags & ShapeFlags.TEXT_CHILDREN) {
        // 比较文本节点
        patchText(n1, n2);
      }
    }
  };

  function patchElement(
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null
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
      insert(el, container);
    } else {
      el = n2.el = n1.el;
      const p1 = n1.props;
      const p2 = n2.props;

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
      // TODO 比较子节点
      patchChildren(n1, n2, el, parentComponent);
    }
  }

  const patchText = (n1: VNode, n2: VNode) => {
    const el = (n2.el = n1.el);
    if (n2.children !== n1.children) {
      setText(el, n2.children as string);
    }
  };

  const replaceVNode = (n1: VNode, n2: VNode, container: RendererElement) => {
    if (n1.shapeFlag & ShapeFlags.COMPONENT) {
      // TODO 卸载组件
    } else {
      remove(n1.el);
    }
    if (n2) {
      mount(n2, container);
    }
  };

  function patchComponent(
    n1: VNode,
    n2: VNode,
    container: RendererElement,
    parentComponent = null
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
    instance.update = effect(() => {
      if (!instance.isMounted) {
        console.log("mount component");
        // 首次挂载
        // TODO beforeMounted hooks

        // 执行渲染函数并保存在实例上
        const subTree = instance.render();
        instance.subTree = subTree;
        instance.isMounted = true;
        mount(subTree, container, instance);
        vnode.el = subTree.el;
        // Mounted hooks
      } else {
        console.log("update component");
        // 非首次
        let { next } = instance;

        // TODO beforeUpdate hooks

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

        // TODO beforeUpdate hooks
      }
    });
  }

  function updateComponent(n1: VNode, n2: VNode, container: RendererElement) {
    const instance = (n2.instance = n1.instance);
    const p1 = { ...n1.props, children: n1.children };
    const p2 = { ...n2.props, children: n2.children };

    if (shouldComponentUpdate(p1, p2)) {
      instance.next = n2;
      instance.updated();
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
    console.log("patchChildren");
    // 文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子元素为text,判断前后是否相等，不相等直接更新
      if (c1 !== c2) {
        setElementText(n1.el, c2 as string);
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

const patch: PatchFn = (
  prevVNode,
  nextVNode,
  container,
  parentComponent = null
) => {
  const { shapeFlag: nextFlags } = nextVNode;
  const { shapeFlag: prevFlags } = prevVNode;
};
