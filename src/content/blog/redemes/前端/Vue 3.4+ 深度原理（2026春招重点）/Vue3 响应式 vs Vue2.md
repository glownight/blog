---
title: "Vue3 响应式 vs Vue2"
publishDate: 2025-09-27 04:33:53
tags: 
  - Vue
  - 响应式
  - 性能优化
language: '中文'
---

## Vue2响应式：那些年我们踩过的坑

Vue2的响应式基于Object.defineProperty，虽然稳定但存在不少限制。在大型项目中，我们经常遇到这些问题：

### 1. 数组监控的局限性

```javascript
// ❌ Vue2无法检测的数组操作
const items = Vue.observable([1, 2, 3]);

// 这些操作不会触发响应式更新
items[0] = 100; // 直接索引赋值
items.length = 0; // 修改length

// 必须使用Vue.set或数组方法
Vue.set(items, 0, 100); // 正确方式
items.splice(0, 1, 100); // 正确方式
```

### 2. 动态添加属性的痛苦

```javascript
// ❌ 动态添加属性不会响应式
const user = Vue.observable({ name: '张三' });
user.age = 25; // 不会触发更新

// ✅ 必须使用Vue.set
Vue.set(user, 'age', 25);

// 在大型表单中，这种限制特别痛苦
function addFormField(form, fieldName, value) {
    // 每次都要记得用Vue.set
    Vue.set(form.fields, fieldName, {
        value: value,
        valid: false,
        touched: false
    });
}
```

## Vue3响应式：Proxy带来的革命

Vue3基于Proxy重构了响应式系统，解决了Vue2的诸多痛点。在实际项目中，体验提升非常明显：

### 1. 完整的对象监控

```javascript
// ✅ Vue3可以监控所有操作
const user = reactive({ name: '张三' });

// 这些操作都能正常触发响应式
user.age = 25; // 动态添加属性
user.contacts = { phone: '138****1234' };
user.contacts.email = 'zhangsan@example.com'; // 嵌套属性

// 数组操作也更加自然
const items = reactive([1, 2, 3]);
items[0] = 100; // 直接索引赋值
items.length = 0; // 修改length
```

### 2. 性能优化实战

Vue3的响应式在性能上有显著提升，特别是在大型数据场景下：

```javascript
// 电商项目中的商品列表优化
const productStore = reactive({
    products: [],
    filters: {},
    pagination: { page: 1, size: 20 }
});

// Vue3的惰性响应式（Lazy Reactivity）
watchEffect(() => {
    // 只有实际访问的属性才会被追踪
    const filteredProducts = productStore.products.filter(p => 
        p.price > productStore.filters.minPrice &&
        p.category === productStore.filters.category
    );
    
    // 如果filters.minPrice没有变化，不会重新计算
    renderProductList(filteredProducts);
});
```
            
            // 深度响应式
            if (isObject(res)) {
                return reactive(res);
            }
            
            return res;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            
            const result = Reflect.set(target, key, value, receiver);
            
            // 触发更新
            if (hasChanged(value, oldValue)) {
                trigger(target, key, value, oldValue);
            }
            
            return result;
        }
    });
}

// 支持数组所有操作
const arr = reactive([1, 2, 3]);
arr.push(4); // ✅ 可检测
arr.length = 0; // ✅ 可检测
```

## 二、性能对比分析

### 1. 初始化性能
```javascript
// Vue2 初始化性能问题
const data = {
    // 大型对象，包含数千个属性
    prop1: 'value1',
    prop2: 'value2',
    // ...
};

// 每个属性都需要 defineProperty
Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key]);
});
// 时间复杂度: O(n)

// Vue3 Proxy 初始化
const reactiveData = reactive(data);
// 时间复杂度: O(1)
```

### 2. 内存使用对比
```javascript
// Vue2 内存使用
class Dep {
    constructor() {
        this.subs = []; // 存储所有依赖
    }
    
    depend() {
        if (Dep.target) {
            this.subs.push(Dep.target);
        }
    }
    
    notify() {
        this.subs.forEach(sub => sub.update());
    }
}

// 每个响应式属性都有一个 Dep 实例
// 内存占用较大

// Vue3 内存优化
const targetMap = new WeakMap(); // 弱引用，自动垃圾回收

function track(target, key) {
    if (!activeEffect) return;
    
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    
    dep.add(activeEffect);
}
```

## 三、功能特性对比

### 1. 数组操作支持
```javascript
// Vue2 数组 hack
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(method => {
    const original = arrayProto[method];
    
    arrayMethods[method] = function(...args) {
        const result = original.apply(this, args);
        
        // 手动通知更新
        const ob = this.__ob__;
        ob.dep.notify();
        
        return result;
    };
});

// Vue3 原生支持
const arr = reactive([1, 2, 3]);

// 所有数组方法都能触发响应式
arr.push(4);
arr.splice(1, 1);
arr[0] = 10;
```

### 2. 动态属性添加
```javascript
// Vue2 动态属性问题
const obj = { count: 0 };
const vm = new Vue({
    data: obj
});

// 新增属性无法响应式
vm.newProp = 'value'; // ❌ 不会触发更新

// 必须使用 Vue.set
Vue.set(vm, 'newProp', 'value'); // ✅

// Vue3 动态属性支持
const obj = reactive({ count: 0 });
obj.newProp = 'value'; // ✅ 自动响应式
```

## 四、开发体验对比

### 1. Composition API vs Options API
```javascript
// Vue2 Options API
export default {
    data() {
        return {
            count: 0,
            message: 'Hello'
        };
    },
    computed: {
        doubled() {
            return this.count * 2;
        }
    },
    methods: {
        increment() {
            this.count++;
        }
    }
};

// Vue3 Composition API
import { ref, computed } from 'vue';

export default {
    setup() {
        const count = ref(0);
        const message = ref('Hello');
        
        const doubled = computed(() => count.value * 2);
        
        const increment = () => {
            count.value++;
        };
        
        return {
            count,
            message,
            doubled,
            increment
        };
    }
};
```

### 2. TypeScript 支持
```typescript
// Vue2 TypeScript 支持有限
import Vue from 'vue';

export default Vue.extend({
    data() {
        return {
            count: 0 // 类型推断有限
        };
    }
});

// Vue3 完整的 TypeScript 支持
import { defineComponent, ref } from 'vue';

export default defineComponent({
    setup() {
        const count = ref<number>(0); // 完整类型支持
        
        return {
            count
        };
    }
});
```

## 五、实际性能测试

### 1. 大型对象处理
```javascript
// 测试代码
function createLargeObject(size) {
    const obj = {};
    for (let i = 0; i < size; i++) {
        obj[`prop${i}`] = i;
    }
    return obj;
}

// Vue2 性能测试
console.time('Vue2 reactive');
const vue2Obj = createLargeObject(10000);
Object.keys(vue2Obj).forEach(key => {
    defineReactive(vue2Obj, key, vue2Obj[key]);
});
console.timeEnd('Vue2 reactive');

// Vue3 性能测试
console.time('Vue3 reactive');
const vue3Obj = createLargeObject(10000);
const reactiveObj = reactive(vue3Obj);
console.timeEnd('Vue3 reactive');
```

### 2. 数组操作性能
```javascript
// 数组操作性能对比
const largeArray = Array.from({ length: 10000 }, (_, i) => i);

// Vue2 数组
const vue2Array = [];
largeArray.forEach(item => vue2Array.push(item));

// Vue3 数组
const vue3Array = reactive([]);
largeArray.forEach(item => vue3Array.push(item));

// 性能测试显示 Vue3 有明显优势
```

Vue3 的响应式系统在性能、功能和开发体验上都优于 Vue2，是现代前端开发的更好选择。