/**
 * @description: dom操作 TODO缺少处理svg元素
 */

export const nodeOps = {
  // 创建元素
  createElement(type: string): Element {
    return document.createElement(type);
  },

  // 创建文本
  createText: (text: string) => document.createTextNode(text),
	// 创建comment
  createComment: (text: string) => document.createComment(text),

  // 设置文本内容
  setText: (node: Node, text: string) => {
    node.nodeValue = text;
  },
  // 设置元素内容
  setElementText(el: Element, text: string): void {
    (el as HTMLElement).innerText = text;
  },

  // 插入
  insert<T extends Node>(child: T, parent: Node, anchor: Node | null = null) {
    parent.insertBefore(child, anchor || null);
  },

  // 移除
  remove(child: Node) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  // 获取父节点
  parentNode: (node: Node) => node.parentNode as Element | null,
  // 获取下个兄弟
  nextSibling: (node: Node) => node.nextSibling,
};
