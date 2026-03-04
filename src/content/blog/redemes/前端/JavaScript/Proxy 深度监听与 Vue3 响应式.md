---
title: "Proxy 深度监听与 Vue3 响应式"
publishDate: 2026-02-03 01:15:35
tags: 
  - JavaScript
language: '中文'
---

## 一、Proxy 基础概念

### Proxy 基本用法
```javascript
const target = { name: '张三', age: 25 };

const handler = {
    get(target, property, receiver) {
        console.log(`读取属性: ${property}`);
        return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
        console.log(`设置属性: ${property} = ${value}`);
        return Reflect.set(target, property, value, receiver);
    }
};

const proxy = new Proxy(target, handler);

// 触发 get 拦截
console.log(proxy.name); // 输出: 读取属性: name, 张三

// 触发 set 拦截
proxy.age = 26; // 输出: 设置属性: age = 26
```

### Proxy 支持的拦截操作
```javascript
const handler = {
    // 属性读取拦截
    get(target, prop, receiver) {
        return Reflect.get(...arguments);
    },
    
    // 属性设置拦截
    set(target, prop, value, receiver) {
        return Reflect.set(...arguments);
    },
    
    // 属性删除拦截
    deleteProperty(target, prop) {
        return Reflect.deleteProperty(...arguments);
    },
    
    // in 操作符拦截
    has(target, prop) {
        return Reflect.has(...arguments);
    },
    
    // Object.keys() 拦截
    ownKeys(target) {
        return Reflect.ownKeys(...arguments);
    }
};
```

## 二、Vue3 响应式原理

### 1. reactive 函数实现
```javascript
// Vue3 核心响应式实现
function reactive(target) {
    return createReactiveObject(
        target,
        reactiveMap,
        mutableHandlers
    );
}

function createReactiveObject(target, proxyMap, baseHandlers) {
    // 避免重复代理
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    
    // 创建 Proxy
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    
    return proxy;
}

// 基础处理器
const mutableHandlers = {
    get(target, key, receiver) {
        // 依赖收集
        track(target, 'get', key);
        
        const res = Reflect.get(target, key, receiver);
        
        // 深度响应式处理
        if (isObject(res)) {
            return reactive(res);
        }
        
        return res;
    },
    
    set(target, key, value, receiver) {
        const oldValue = target[key];
        
        // 触发更新
        const result = Reflect.set(target, key, value, receiver);
        
        if (hasChanged(value, oldValue)) {
            trigger(target, 'set', key, value, oldValue);
        }
        
        return result;
    }
};
```

### 2. 依赖收集与触发
```javascript
// 依赖收集
const targetMap = new WeakMap();

function track(target, type, key) {
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

// 触发更新
function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    
    const effects = new Set();
    
    // 收集相关依赖
    if (key !== void 0) {
        const dep = depsMap.get(key);
        if (dep) {
            dep.forEach(effect => effects.add(effect));
        }
    }
    
    // 触发依赖更新
    effects.forEach(effect => {
        if (effect.scheduler) {
            effect.scheduler();
        } else {
            effect.run();
        }
    });
}
```

## 三、深度监听实现

### 1. 深度响应式处理
```javascript
function deepReactive(target) {
    if (!isObject(target)) return target;
    
    // 处理数组
    if (Array.isArray(target)) {
        target.forEach((item, index) => {
            if (isObject(item)) {
                target[index] = deepReactive(item);
            }
        });
    } else {
        // 处理对象
        Object.keys(target).forEach(key => {
            if (isObject(target[key])) {
                target[key] = deepReactive(target[key]);
            }
        });
    }
    
    return reactive(target);
}

// 使用示例
const deepObj = deepReactive({
    user: {
        profile: {
            name: '张三',
            address: {
                city: '北京',
                street: '朝阳区'
            }
        }
    },
    tags: ['前端', 'Vue3', '响应式']
});

// 深度监听生效
deepObj.user.profile.address.city = '上海'; // 触发响应式更新
```

### 2. 性能优化策略
```javascript
// 懒代理模式
function lazyReactive(target) {
    const handler = {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);
            
            // 延迟代理
            if (isObject(result) && !isReactive(result)) {
                return reactive(result);
            }
            
            return result;
        }
    };
    
    return new Proxy(target, handler);
}

// 缓存代理结果
const reactiveCache = new WeakMap();

function cachedReactive(target) {
    if (reactiveCache.has(target)) {
        return reactiveCache.get(target);
    }
    
    const proxy = reactive(target);
    reactiveCache.set(target, proxy);
    
    return proxy;
}
```

## 四、与 Vue2 响应式对比

### Vue2 Object.defineProperty 限制
```javascript
// Vue2 响应式实现
function defineReactive(obj, key, val) {
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            // 依赖收集
            dep.depend();
            return val;
        },
        set(newVal) {
            if (newVal === val) return;
            val = newVal;
            // 触发更新
            dep.notify();
        }
    });
}

// Vue2 的限制
const obj = {};

// 无法检测新增属性
obj.newProperty = 'value'; // 非响应式

// 无法检测数组索引变化
const arr = [1, 2, 3];
arr[0] = 0; // 非响应式（需要特殊处理）
```

### Vue3 Proxy 优势
```javascript
// Vue3 解决 Vue2 的限制
const proxyObj = reactive({});

// 支持新增属性
proxyObj.newProperty = 'value'; // 响应式

// 支持数组索引变化
const proxyArr = reactive([1, 2, 3]);
proxyArr[0] = 0; // 响应式

// 支持动态属性删除
delete proxyObj.someProperty; // 响应式
```

## 五、实际应用场景

### 1. 表单数据绑定
```javascript
// 复杂表单响应式处理
const formData = reactive({
    userInfo: {
        name: '',
        age: 0,
        contacts: [
            { type: 'phone', value: '' },
            { type: 'email', value: '' }
        ]
    },
    preferences: {
        theme: 'light',
        language: 'zh-CN'
    }
});

// 深度监听所有变化
watchEffect(() => {
    console.log('表单数据变化:', formData);
});
```

### 2. 状态管理集成
```javascript
// 基于 Proxy 的状态管理
class Store {
    constructor(state) {
        this._state = reactive(state);
        this._mutations = new Map();
    }
    
    commit(mutation, payload) {
        const handler = this._mutations.get(mutation);
        if (handler) {
            handler(this._state, payload);
        }
    }
    
    get state() {
        return this._state;
    }
}
```

Proxy 为 Vue3 带来了更强大、更灵活的响应式能力，是现代前端开发中的重要技术。