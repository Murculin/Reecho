// 通过位运算实现快速判断组件类型而定义的枚举类型
export const enum ShapeFlags {
  ELEMENT = 1, // 00000001 -> 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 00000010 -> 2
  TEXT_CHILDREN = 1 << 3, // 00001000 -> 8
  ARRAY_CHILDREN = 1 << 4, // 00010000 -> 16
  SLOTS_CHILDREN = 1 << 5, // 00100000 -> 32
  TELEPORT = 1 << 6, // ...=
  COMPONENT = ShapeFlags.FUNCTIONAL_COMPONENT, // 00000110
}
