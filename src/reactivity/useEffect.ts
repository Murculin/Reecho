import { effect } from "./effect";
import { queuePostFlushCb } from "../runtime-core/scheduler";

export function useEffect(fn: () => any) {
  effect(fn, {
    lazy: false,
    scheduler: queuePostFlushCb,
  });
}
