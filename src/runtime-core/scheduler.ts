import { isArray } from "../shared/index";

const p = Promise.resolve();

export interface SchedulerJob {
  (): void;
  // id?: number;
  // ownerInstance?: ComponentInstance;
}

export type SchedulerCb = Function & { id?: number };
export type SchedulerCbs = SchedulerCb | SchedulerCb[];

//  主任务队列 用来存放执行组件渲染和更新的任务
const queue: SchedulerJob[] = [];
// 后任务队列 用来存放类似onMouted onUpdated一类需要在一轮渲染之后调用的钩子函数
const pendingPostFlushCbs: SchedulerCb[] = [];

let isFlushPending = false;
let isFlushing = false;

export function nextTick(fn: any) {
  return fn ? p.then(fn) : p;
}

// 添加渲染后任务
export function queuePostFlushCb(cb: SchedulerCbs) {
  queueCb(cb);
}

export function queueCb(cb: SchedulerCbs) {
  if (!isArray(cb)) {
    pendingPostFlushCbs.push(cb);
  } else {
    pendingPostFlushCbs.push(...cb);
  }
  queueFlush();
}

// 将任务推入队列尾, 并从队首开始执行
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    // 执行所有的 job
    queueFlush();
  }
}


// 执行一轮任务
function queueFlush() {
  // 如果同时触发了两个组件的更新的话
  // 这里就会触发两次 then （微任务逻辑）
  // 所以需要判断一下 如果已经触发过 nextTick 了
  // 那么后面就不需要再次触发 nextTick 逻辑了
  if (isFlushing || isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
	isFlushPending = false;
  isFlushing = true;
  try {
    for (let flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job) {
        job();
      }
    }
  } catch (e) {
    throw e;
  } finally {
    // 执行结束或报错 清空主任务队列
    queue.length = 0;
    let pendingJob: SchedulerCb;
    while ((pendingJob = pendingPostFlushCbs.shift())) {
      if (pendingJob) {
        pendingJob();
      }
    }
    isFlushing = false;

    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}