---
title: "Teleport 与 Suspense"
publishDate: 2025-08-27 09:40:24
tags: 
  - Vue
language: '中文'
---

## 一、Teleport 组件

### 1. 基本用法
```vue
<!-- 将模态框渲染到 body 末尾 -->
<template>
  <div>
    <button @click="showModal = true">打开模态框</button>
    
    <Teleport to="body">
      <Modal v-if="showModal" @close="showModal = false">
        <h2>模态框标题</h2>
        <p>模态框内容</p>
      </Modal>
    </Teleport>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const showModal = ref(false);
    return { showModal };
  }
};
</script>
```

### 2. 多目标 Teleport
```vue
<!-- 支持多个 Teleport 目标 -->
<template>
  <div>
    <Teleport to="#modal-container">
      <Modal1 />
    </Teleport>
    
    <Teleport to="#notification-container">
      <Notification />
    </Teleport>
    
    <!-- 同一个目标可以多次使用 -->
    <Teleport to="#modal-container">
      <Modal2 />
    </Teleport>
  </div>
</template>

<!-- HTML 结构 -->
<body>
  <div id="app"></div>
  <div id="modal-container"></div>
  <div id="notification-container"></div>
</body>
```

## 二、Suspense 组件

### 1. 异步组件加载
```vue
<!-- 使用 Suspense 处理异步组件 -->
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>

<script>
import { defineAsyncComponent } from 'vue';

const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue')
);

export default {
  components: { AsyncComponent }
};
</script>
```

### 2. 组合式 API 中的异步
```vue
<template>
  <Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
    <AsyncUserProfile :userId="userId" />
    
    <template #fallback>
      <UserProfileSkeleton />
    </template>
  </Suspense>
</template>

<script>
import { ref } from 'vue';

const AsyncUserProfile = defineAsyncComponent({
  loader: () => import('./UserProfile.vue'),
  delay: 200, // 延迟显示 fallback
  timeout: 3000, // 超时时间
  errorComponent: ErrorComponent, // 错误组件
  loadingComponent: LoadingComponent // 加载组件
});

export default {
  components: { AsyncUserProfile },
  setup() {
    const userId = ref(1);
    
    const onPending = () => {
      console.log('组件开始加载');
    };
    
    const onResolve = () => {
      console.log('组件加载完成');
    };
    
    return { userId, onPending, onResolve };
  }
};
</script>
```

Teleport 和 Suspense 为 Vue 应用提供了更强大的组件控制和异步处理能力。