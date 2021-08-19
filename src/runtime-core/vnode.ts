import { isArray } from "../shared";
import { ShapeFlags } from "../shared/shapFlags";
import { Ref } from "../reactivity/index";

export const Text = Symbol("Text");
export const Comment = Symbol("Comment");
export const Static = Symbol("Static");

export type VNodeTypes =
  | string
  | VNode
  | any
  | typeof Text
  | typeof Static
  | typeof Comment;

export type VNodeNormalizedChildren = string | any[] | null;
export type VNodeRef = string | Ref;

export type Data = Record<string, unknown>;
export type VNodeProps = {
  key?: string | number;
  ref?: VNodeRef;
};

export interface VNode<
  HostNode = {
    [key: string]: any;
  },
  HostElement = {
    [key: string]: any;
  },
  ExtraProps = { [key: string]: any }
> {
  _isVNode: boolean;

  // DOM
  el: HostNode | null;
  type: VNodeTypes;
  props: any;
  key: string | number | null;
  ref: any;
  children: VNodeNormalizedChildren;
  shapeFlag: number;
  appContext?: any;
  instance?: any;
}

export function createVNode(
  type: any,
  props: (Data & VNodeProps) | null = {},
  children: VNodeNormalizedChildren = null
): VNode {
  const vnode = {
    el: null,
    component: null,
    key: props?.key || null,
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    _isVNode: true,
    ref: null,
  };

  // 基于 children 再次设置 shapeFlag
  if (isArray(children)) {
    const { length } = children;
    if (length > 1) {
      // 多个子节点，且子节点使用key
      children = normalizeVNodes(children);
    }

    // |= 位运算
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === "string" || "number") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }

  return vnode;
}

// 为子节点设置key
function normalizeVNodes(children: any[]) {
  const ret = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child && child.key && child.key == null) {
      // 如果原来的 VNode 没有手动指定的key，则使用竖线(|)与该VNode在数组中的索引拼接而成的字符串作为key
      child.key = "|" + i;
    }
    ret.push(child);
  }
  return ret;
}

export function isVNode(target: any) {
  return target && target._isVNode;
}

// 基于 type 来判断是什么类型的组件
function getShapeFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.FUNCTIONAL_COMPONENT;
}
