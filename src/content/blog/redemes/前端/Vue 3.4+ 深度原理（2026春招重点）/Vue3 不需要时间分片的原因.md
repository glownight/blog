---
title: "Vue3 不需要时间分片的原因"
publishDate: 2025-09-23 15:18:25
tags: 
  - Vue
language: '中文'
---

## 一、响应式系统的精确更新

### 1. 依赖追踪机制
```javascript
// Vue3 精确的依赖追踪
const obj = reactive({ 
    a: 1, 
    b: 2, 
    c: { d: 3 } 
});

// 只追踪实际使用的属性
effect(() => {
    console.log(obj.a); // 只追踪 obj.a
});

// 修改未使用的属性不会触发更新
obj.b = 3; // 不会触发 effect
obj.c.d = 4; // 不会触发 effect
```

### 2. 与 React 的对比
```javascript
// React 需要完整重新渲染
function ReactComponent() {
    const [state, setState] = useState({ a: 1, b: 2, c: { d: 3 } });
    
    // 即使只使用 a，整个组件都会重新渲染
    return <div>{state.a}</div>;
}

// Vue3 精确更新
const VueComponent = {
    setup() {
        const state = reactive({ a: 1, b: 2, c: { d: 3 } });
        
        // 只更新使用 a 的模板部分
        return () => <div>{state.a}</div>;
    }
};
```

## 二、编译时优化

### 1. Block Tree 优化
```javascript
// 编译时生成的 Block Tree
<template>
  <div>
    <span>静态内容</span>
    <p v-if="show">{{ dynamic }}</p>
    <ul>
      <li v-for="item in list" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>

// 编译后生成优化的更新路径
function render() {
  return (_openBlock(), _createBlock("div", null, [
    _hoisted_1, // 静态提升
    _createVNode("p", null, _toDisplayString(dynamic), 1 /* TEXT */),
    _renderList(list, (item) => {
      return _createVNode("li", { key: item.id }, _toDisplayString(item.name), 1 /* TEXT */);
    })
  ]));
}
```

### 2. Patch Flags 精确更新
```javascript
// 通过 Patch Flags 标识动态内容
const vnode = {
  type: 'div',
  children: [
    { type: 'span', children: '静态', patchFlag: PatchFlags.HOISTED },
    { 
      type: 'p', 
      children: dynamicValue, 
      patchFlag: PatchFlags.TEXT // 只有文本需要更新
    }
  ]
};

// 更新时只处理有标记的节点
function patch(n1, n2) {
  if (n2.patchFlag & PatchFlags.TEXT) {
    // 只更新文本内容
    hostSetElementText(n2.el, n2.children);
  }
}
```

## 三、异步更新批处理

### 1. 微任务批处理
```javascript
// Vue3 的异步更新队列
const queue = [];
let isFlushing = false;

function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  
  if (!isFlushing) {
    isFlushing = true;
    
    // 使用微任务批处理
    Promise.resolve().then(flushJobs);
  }
}

function flushJobs() {
  try {
    // 批量执行更新
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
    }
  } finally {
    isFlushing = false;
    queue.length = 0;
  }
}
```

### 2. 与 React 调度器对比
```javascript
// React 需要复杂的时间分片
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
  
  // 需要检查是否应该让出主线程
  if (workInProgress !== null) {
    // 安排下一次执行
    scheduleCallback(workLoopConcurrent);
  }
}

// Vue3 简单的微任务批处理
function updateComponent() {
  // 直接加入队列，由微任务统一处理
  queueJob(componentUpdateFn);
}
```

## 四、实际性能表现

### 1. 大型列表更新测试
```javascript
// Vue3 列表更新性能
const list = reactive(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: Math.random()
})));

// 更新单个项目
list[5000].value = Math.random();
// 只更新对应的 DOM 节点，性能优秀

// React 同等场景
const [list, setList] = useState(/* 相同数据 */);

// 更新需要重新渲染整个列表组件
setList(updatedList);
// 需要虚拟 DOM diff，性能相对较差
```

### 2. 复杂组件树更新
```javascript
// Vue3 组件树更新
const App = {
  setup() {
    const state = reactive({
      user: { name: 'Alice', profile: { avatar: 'a.jpg' } },
      settings: { theme: 'dark', notifications: true }
    });
    
    // 只更新实际使用的部分
    return () => (
      <div>
        <Header user={state.user} />
        <Content settings={state.settings} />
      </div>
    );
  }
};

// 修改 user.profile.avatar 只触发 Header 更新
```

Vue3 通过精确的响应式追踪和编译时优化，避免了时间分片的复杂性，同时保证了优秀的性能表现。