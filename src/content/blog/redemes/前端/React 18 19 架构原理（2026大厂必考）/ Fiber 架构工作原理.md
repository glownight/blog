---
title: "Fiber 架构工作原理"
publishDate: 2025-11-22 03:08:44
tags: 
  - React
language: '中文'
---

## 一、Fiber 架构背景与设计目标

### 1. Stack Reconciler 的问题
```javascript
// React 15 的 Stack Reconciler 工作模式
function reconcileChildren(prevChildren, nextChildren) {
    // 深度优先遍历，无法中断
    for (let i = 0; i < prevChildren.length; i++) {
        const prevChild = prevChildren[i];
        const nextChild = nextChildren[i];
        
        // 递归比较子节点
        reconcile(prevChild, nextChild);
    }
}

// 问题：
// 1. 同步阻塞：大型组件树会导致主线程阻塞
// 2. 无法中断：一旦开始渲染必须完成
// 3. 优先级处理困难：无法根据优先级调度任务
```

### 2. Fiber 的设计目标
```javascript
// Fiber 架构的核心目标
const fiberDesignGoals = {
    // 1. 可中断性：能够暂停、恢复渲染工作
    interruptible: true,
    
    // 2. 优先级调度：根据任务优先级安排执行顺序
    priorityBased: true,
    
    // 3. 并发渲染：支持并发模式下的渲染
    concurrent: true,
    
    // 4. 错误边界：更好的错误处理机制
    errorBoundaries: true
};
```

## 二、Fiber 节点数据结构

### 1. Fiber 节点基本结构
```javascript
// Fiber 节点的核心属性
class FiberNode {
    constructor(tag, pendingProps, key, mode) {
        // 实例属性
        this.tag = tag; // 组件类型（Function/Class/Host等）
        this.key = key; // 唯一标识
        this.elementType = null; // 元素类型
        this.type = null; // 函数/类/标签名
        this.stateNode = null; // 对应的真实DOM节点
        
        // Fiber 树结构
        this.return = null; // 父节点
        this.child = null; // 第一个子节点
        this.sibling = null; // 下一个兄弟节点
        this.index = 0; // 在父节点中的索引
        
        // 副作用标记
        this.flags = NoFlags; // 副作用标记（增、删、更新等）
        this.subtreeFlags = NoFlags; // 子树副作用标记
        this.deletions = null; // 待删除的子节点
        
        // 状态和属性
        this.pendingProps = pendingProps; // 新属性
        this.memoizedProps = null; // 上一次渲染的属性
        this.memoizedState = null; // 上一次渲染的状态
        this.updateQueue = null; // 更新队列
        
        // 调度相关
        this.lanes = NoLanes; // 优先级车道
        this.childLanes = NoLanes; // 子节点优先级
        
        // 备用节点（用于双缓存）
        this.alternate = null;
    }
}
```

### 2. Fiber 节点类型
```javascript
// Fiber 节点类型定义
const FunctionComponent = 0;
const ClassComponent = 1;
const IndeterminateComponent = 2; // 尚未确定类型
const HostRoot = 3; // 根节点
const HostPortal = 4; // Portal
const HostComponent = 5; // DOM元素（div、span等）
const HostText = 6; // 文本节点
const Fragment = 7;
const Mode = 8;
const ContextConsumer = 9;
const ContextProvider = 10;
const ForwardRef = 11;
const Profiler = 12;
const SuspenseComponent = 13;
const MemoComponent = 14;
const SimpleMemoComponent = 15;
const LazyComponent = 16;
```

## 三、Fiber 渲染流程

### 1. 双缓存机制
```javascript
// Fiber 双缓存工作原理
class FiberRoot {
    constructor(containerInfo, tag, hydrate) {
        this.containerInfo = containerInfo; // DOM容器
        this.current = null; // 当前显示的Fiber树
        this.finishedWork = null; // 已完成的Fiber树
        
        // 双缓存切换
        this.swapFiberTrees = () => {
            const finishedWork = this.finishedWork;
            if (finishedWork !== null) {
                // 提交新树
                commitRoot(finishedWork);
                // 切换current指针
                this.current = finishedWork;
                this.finishedWork = null;
            }
        };
    }
}

// 渲染流程
function renderRootSync(root, lanes) {
    // 准备新的工作树
    prepareFreshStack(root, lanes);
    
    // 执行工作循环
    workLoopSync();
    
    // 完成工作
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    
    // 提交更改
    commitRoot(root);
}
```

### 2. 工作循环机制
```javascript
// 同步工作循环
function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

// 异步工作循环（可中断）
function workLoopConcurrent() {
    while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
    }
}

// 执行单个工作单元
function performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;
    
    // 开始阶段：创建子Fiber节点
    let next = beginWork(current, unitOfWork, subtreeRenderLanes);
    
    if (next === null) {
        // 如果没有子节点，完成当前节点
        completeUnitOfWork(unitOfWork);
    } else {
        // 继续处理子节点
        workInProgress = next;
    }
}

// 完成工作单元
function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
    
    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;
        
        // 完成当前节点
        completeWork(current, completedWork, subtreeRenderLanes);
        
        // 处理兄弟节点
        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }
        
        // 回溯到父节点
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null);
}
```

## 四、优先级调度机制

### 1. 优先级车道（Lanes）
```javascript
// 优先级车道定义
const SyncLane = 0b0000000000000000000000000000001; // 同步优先级
const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入
const DefaultLane = 0b0000000000000000000000000010000; // 默认优先级
const IdleLane = 0b0100000000000000000000000000000; // 空闲优先级

// 车道操作
function getHighestPriorityLane(lanes) {
    return lanes & -lanes; // 获取最高优先级车道
}

function mergeLanes(a, b) {
    return a | b; // 合并车道
}

function includesSomeLane(a, b) {
    return (a & b) !== NoLanes; // 检查是否包含某些车道
}
```

### 2. 任务调度
```javascript
// 调度器核心逻辑
class Scheduler {
    constructor() {
        this.taskQueue = []; // 任务队列
        this.currentTask = null; // 当前执行的任务
        this.isPerformingWork = false; // 是否正在执行工作
    }
    
    // 调度任务
    scheduleCallback(priorityLevel, callback, options) {
        // 创建新任务
        const newTask = {
            id: taskIdCounter++,
            callback,
            priorityLevel,
            startTime: getCurrentTime(),
            expirationTime: getCurrentTime() + timeoutForPriorityLevel(priorityLevel)
        };
        
        // 根据优先级插入队列
        pushTask(newTask);
        
        // 请求调度
        requestHostCallback(flushWork);
    }
    
    // 执行工作
    flushWork(hasTimeRemaining, initialTime) {
        this.isPerformingWork = true;
        
        try {
            return workLoop(hasTimeRemaining, initialTime);
        } finally {
            this.isPerformingWork = false;
        }
    }
    
    // 工作循环
    workLoop(hasTimeRemaining, initialTime) {
        let currentTime = initialTime;
        this.currentTask = peekTask();
        
        while (this.currentTask !== null) {
            if (this.currentTask.expirationTime > currentTime &&
                (!hasTimeRemaining || shouldYieldToHost())) {
                // 时间片用尽，中断执行
                break;
            }
            
            // 执行任务
            const callback = this.currentTask.callback;
            if (callback !== null) {
                this.currentTask.callback = null;
                const didUserCallbackTimeout = this.currentTask.expirationTime <= currentTime;
                
                const continuationCallback = callback(didUserCallbackTimeout);
                
                if (typeof continuationCallback === 'function') {
                    // 任务需要继续执行
                    this.currentTask.callback = continuationCallback;
                } else {
                    // 任务完成，从队列中移除
                    popTask();
                }
            } else {
                popTask();
            }
            
            this.currentTask = peekTask();
        }
        
        return this.currentTask !== null;
    }
}
```

## 五、并发模式特性

### 1. Suspense 实现原理
```javascript
// Suspense 组件工作原理
function updateSuspenseComponent(current, workInProgress, renderLanes) {
    const nextProps = workInProgress.pendingProps;
    
    // 检查是否有挂起的更新
    const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
    
    if (didSuspend) {
        // 显示 fallback
        const fallbackFragment = mountSuspenseFallbackChildren(
            current,
            workInProgress,
            nextProps,
            renderLanes
        );
        workInProgress.child = fallbackFragment;
        return fallbackFragment.child;
    } else {
        // 显示主要内容
        const primaryChildren = nextProps.children;
        const primaryChildFragment = mountSuspensePrimaryChildren(
            workInProgress,
            primaryChildren
        );
        workInProgress.child = primaryChildFragment;
        return primaryChildFragment.child;
    }
}

// 懒加载组件
function readLazyComponentType(lazyComponent) {
    const result = lazyComponent._result;
    
    if (result === DefaultSuspense) {
        // 组件正在加载中
        throw lazyComponent._ctor();
    }
    
    if (result.status === Resolved) {
        return result.value;
    }
    
    throw result;
}
```

### 2. 时间分片（Time Slicing）
```javascript
// 时间分片实现
function shouldYield() {
    // 检查是否应该让出主线程
    const currentTime = getCurrentTime();
    return currentTime >= deadline;
}

function workLoopConcurrent() {
    // 并发模式下的工作循环
    while (workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
    }
    
    // 如果还有工作未完成，安排下一次执行
    if (workInProgress !== null) {
        // 返回 true 表示还有工作
        return true;
    }
    
    // 工作完成
    return false;
}
```

## 六、性能优化实践

### 1. 使用 Profiler API
```javascript
// React Profiler 使用
function ProfilerExample() {
    return (
        <Profiler 
            id="Navigation" 
            onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
                console.log(`${id} ${phase}:
                    实际耗时: ${actualDuration}ms
                    基准耗时: ${baseDuration}ms
                `);
            }}
        >
            <Navigation />
        </Profiler>
    );
}
```

### 2. 优化组件渲染
```javascript
// 避免不必要的重新渲染
function OptimizedComponent({ data }) {
    const memoizedData = useMemo(() => {
        return expensiveComputation(data);
    }, [data]);
    
    const handleClick = useCallback(() => {
        // 处理点击事件
    }, []);
    
    return (
        <div onClick={handleClick}>
            {memoizedData}
        </div>
    );
}

// 使用 React.memo 优化纯组件
const PureComponent = React.memo(function PureComponent({ value }) {
    return <div>{value}</div>;
});
```

Fiber 架构为 React 带来了革命性的性能提升，理解其工作原理有助于更好地优化 React 应用。