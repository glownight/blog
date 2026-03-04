---
title: "useEffect 依赖数组判断机制"
publishDate: 2025-11-28 13:40:25
tags: 
  - React
language: '中文'
---

## 一、依赖数组基本用法

### 1. 三种依赖数组模式
```javascript
// 1. 无依赖数组 - 每次渲染后都执行
useEffect(() => {
    console.log('每次渲染后执行');
});

// 2. 空依赖数组 - 仅在挂载时执行
useEffect(() => {
    console.log('仅在组件挂载时执行');
}, []);

// 3. 有依赖数组 - 依赖变化时执行
useEffect(() => {
    console.log('count 变化时执行:', count);
}, [count]);
```

### 2. 依赖数组的严格比较
```javascript
function ExampleComponent({ user, config }) {
    // 对象和数组需要特别注意
    useEffect(() => {
        // 每次渲染都会创建新的对象，导致 useEffect 重复执行
        const options = { user, ...config };
        fetchData(options);
    }, [user, config]); // 依赖数组包含对象
    
    // 正确的做法：使用 useMemo 或 useCallback
    const memoizedOptions = useMemo(() => ({
        user,
        ...config
    }), [user, config]);
    
    useEffect(() => {
        fetchData(memoizedOptions);
    }, [memoizedOptions]); // 依赖稳定的引用
    
    return <div>{/* 组件内容 */}</div>;
}
```

## 二、依赖判断机制原理

### 1. React 内部实现原理
```javascript
// useEffect 简化实现
function useEffect(create, deps) {
    const hook = currentlyRenderingFiber.memoizedState;
    
    if (hook !== null) {
        const prevDeps = hook[1];
        
        // 依赖比较：使用 Object.is 进行严格相等比较
        if (areHookInputsEqual(deps, prevDeps)) {
            // 依赖未变化，跳过 effect 执行
            return;
        }
    }
    
    // 依赖变化或首次执行，安排 effect
    scheduleEffect(create, deps);
    
    // 更新 hook 状态
    hook[0] = create;
    hook[1] = deps;
}

// 依赖比较函数
function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) {
        // 首次执行，没有之前的依赖
        return false;
    }
    
    // 逐个比较依赖项
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        // 使用 Object.is 进行严格相等比较
        if (Object.is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    
    return true;
}
```

### 2. Object.is 比较规则
```javascript
// Object.is 的比较规则
console.log(Object.is(1, 1)); // true
console.log(Object.is(NaN, NaN)); // true
console.log(Object.is(0, -0)); // false
console.log(Object.is({}, {})); // false - 对象引用不同
console.log(Object.is([], [])); // false - 数组引用不同

// 在 useEffect 中的应用
const obj1 = { name: '张三' };
const obj2 = { name: '张三' };

useEffect(() => {
    console.log('obj 变化');
}, [obj1]); // 每次都会执行，因为 obj1 引用不同

useEffect(() => {
    console.log('稳定的 obj');
}, [useMemo(() => obj2, [])]); // 只在挂载时执行
```

## 三、常见问题与解决方案

### 1. 无限循环问题
```javascript
// 错误的用法：导致无限循环
function BadExample() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        // 每次执行都会更新 count，触发下一次 effect
        setCount(count + 1);
    }); // 缺少依赖数组
    
    return <div>Count: {count}</div>;
}

// 正确的用法：使用函数式更新
function GoodExample() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCount(prevCount => prevCount + 1); // 函数式更新
        }, 1000);
        
        return () => clearInterval(timer);
    }, []); // 空依赖数组
    
    return <div>Count: {count}</div>;
}
```

### 2. 函数依赖处理
```javascript
// 函数作为依赖的问题
function FunctionDependencyExample() {
    const [data, setData] = useState(null);
    
    // 每次渲染都会创建新的 fetchData 函数
    const fetchData = async () => {
        const response = await fetch('/api/data');
        setData(await response.json());
    };
    
    useEffect(() => {
        fetchData();
    }, [fetchData]); // 导致无限循环
    
    // 解决方案1：将函数移到 useEffect 内部
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/data');
            setData(await response.json());
        };
        
        fetchData();
    }, []); // 空依赖数组
    
    // 解决方案2：使用 useCallback
    const stableFetchData = useCallback(async () => {
        const response = await fetch('/api/data');
        setData(await response.json());
    }, []); // 依赖数组为空
    
    useEffect(() => {
        stableFetchData();
    }, [stableFetchData]);
    
    return <div>{/* 组件内容 */}</div>;
}
```

### 3. 对象和数组依赖
```javascript
// 对象和数组依赖处理
function ObjectDependencyExample() {
    const [filters, setFilters] = useState({ 
        category: 'all', 
        sort: 'date' 
    });
    
    // 错误的用法：直接使用对象
    useEffect(() => {
        fetchData(filters);
    }, [filters]); // 每次渲染 filters 引用都不同
    
    // 正确的用法1：使用 useMemo
    const stableFilters = useMemo(() => filters, [
        filters.category, 
        filters.sort
    ]);
    
    useEffect(() => {
        fetchData(stableFilters);
    }, [stableFilters]);
    
    // 正确的用法2：解构依赖
    useEffect(() => {
        fetchData(filters);
    }, [filters.category, filters.sort]);
    
    return <div>{/* 组件内容 */}</div>;
}
```

## 四、高级优化技巧

### 1. 自定义比较函数
```javascript
// 使用自定义比较的 useDeepCompareEffect
import { useRef, useEffect } from 'react';
import { isEqual } from 'lodash';

function useDeepCompareEffect(callback, dependencies) {
    const currentDependenciesRef = useRef();
    
    if (!isEqual(currentDependenciesRef.current, dependencies)) {
        currentDependenciesRef.current = dependencies;
    }
    
    useEffect(callback, [currentDependenciesRef.current]);
}

// 使用示例
function DeepCompareExample({ complexConfig }) {
    useDeepCompareEffect(() => {
        // 只有当 complexConfig 的深层内容变化时才执行
        initializeWithConfig(complexConfig);
    }, [complexConfig]);
    
    return <div>{/* 组件内容 */}</div>;
}
```

### 2. 条件执行 effect
```javascript
// 条件执行 useEffect
function ConditionalEffectExample({ shouldFetch, id }) {
    useEffect(() => {
        if (shouldFetch && id) {
            // 只有在条件满足时才执行
            fetchUserData(id);
        }
    }, [shouldFetch, id]); // 依赖包含条件变量
    
    return <div>{/* 组件内容 */}</div>;
}

// 使用 ref 避免重复执行
function RefConditionalExample({ data }) {
    const hasFetchedRef = useRef(false);
    
    useEffect(() => {
        if (data && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            processData(data);
        }
    }, [data]);
    
    return <div>{/* 组件内容 */}</div>;
}
```

### 3. 批量更新优化
```javascript
// 批量处理多个状态更新
function BatchUpdateExample() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [settings, setSettings] = useState(null);
    
    // 错误的用法：多个独立的 useEffect
    useEffect(() => {
        fetchUser().then(setUser);
    }, []);
    
    useEffect(() => {
        fetchProfile().then(setProfile);
    }, []);
    
    useEffect(() => {
        fetchSettings().then(setSettings);
    }, []);
    
    // 正确的用法：批量处理
    useEffect(() => {
        const initializeData = async () => {
            const [userData, profileData, settingsData] = await Promise.all([
                fetchUser(),
                fetchProfile(),
                fetchSettings()
            ]);
            
            // 批量更新状态
            setUser(userData);
            setProfile(profileData);
            setSettings(settingsData);
        };
        
        initializeData();
    }, []);
    
    return <div>{/* 组件内容 */}</div>;
}
```

## 五、调试与性能分析

### 1. 使用 React DevTools
```javascript
// 启用详细日志
function DebugEffectExample() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        console.log('useEffect 执行，count:', count);
        
        return () => {
            console.log('useEffect 清理，count:', count);
        };
    }, [count]);
    
    return (
        <div>
            <button onClick={() => setCount(c => c + 1)}>
                增加: {count}
            </button>
        </div>
    );
}
```

### 2. 性能测量工具
```javascript
// 使用 React Profiler 测量 effect 性能
import { Profiler } from 'react';

function ProfiledEffectExample() {
    const handleRender = (id, phase, actualDuration) => {
        console.log(`${id} ${phase} 耗时:`, actualDuration);
    };
    
    return (
        <Profiler id="EffectExample" onRender={handleRender}>
            <EffectExample />
        </Profiler>
    );
}
```

### 3. 自定义调试 Hook
```javascript
// 创建调试 Hook
function useWhyDidYouUpdate(name, props) {
    const previousProps = useRef();
    
    useEffect(() => {
        if (previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            const changes = {};
            
            allKeys.forEach(key => {
                if (previousProps.current[key] !== props[key]) {
                    changes[key] = {
                        from: previousProps.current[key],
                        to: props[key]
                    };
                }
            });
            
            if (Object.keys(changes).length) {
                console.log('[why-did-you-update]', name, changes);
            }
        }
        
        previousProps.current = props;
    });
}

// 使用示例
function DebugComponent(props) {
    useWhyDidYouUpdate('DebugComponent', props);
    
    return <div>{/* 组件内容 */}</div>;
}
```

理解 useEffect 的依赖数组判断机制是 React 性能优化的关键，正确使用可以显著提升应用性能。