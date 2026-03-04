---
title: "实现 useTimeout Hook"
publishDate: 2025-06-10 23:38:06
tags: 
  - 场景
language: '中文'
---
## 一、基础实现

### 1. 最简单的 useTimeout
```javascript
import { useEffect, useRef } from 'react';

function useTimeout(callback, delay) {
    const savedCallback = useRef();
    
    // 保存最新的回调函数
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    
    // 设置定时器
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        
        if (delay !== null) {
            const id = setTimeout(tick, delay);
            return () => clearTimeout(id);
        }
    }, [delay]);
}

// 使用示例
function MyComponent() {
    const [count, setCount] = useState(0);
    
    useTimeout(() => {
        setCount(count + 1);
    }, 1000);
    
    return <div>Count: {count}</div>;
}
```

### 2. 支持暂停和重启
```javascript
import { useEffect, useRef, useState } from 'react';

function useTimeoutAdvanced(callback, delay) {
    const savedCallback = useRef();
    const [isActive, setIsActive] = useState(true);
    
    // 保存最新的回调函数
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    
    // 设置定时器
    useEffect(() => {
        if (!isActive || delay === null) return;
        
        function tick() {
            savedCallback.current();
        }
        
        const id = setTimeout(tick, delay);
        return () => clearTimeout(id);
    }, [delay, isActive]);
    
    // 控制方法
    const pause = () => setIsActive(false);
    const resume = () => setIsActive(true);
    const reset = () => {
        setIsActive(false);
        setTimeout(() => setIsActive(true), 0);
    };
    
    return { pause, resume, reset, isActive };
}

// 使用示例
function TimerComponent() {
    const [time, setTime] = useState(0);
    
    const { pause, resume, reset, isActive } = useTimeoutAdvanced(() => {
        setTime(time => time + 1);
    }, 1000);
    
    return (
        <div>
            <div>Time: {time}s</div>
            <button onClick={pause} disabled={!isActive}>暂停</button>
            <button onClick={resume} disabled={isActive}>继续</button>
            <button onClick={reset}>重置</button>
        </div>
    );
}
```

## 二、高级功能实现

### 1. 支持立即执行和取消
```javascript
import { useEffect, useRef, useCallback } from 'react';

function useTimeoutEnhanced(callback, delay, immediate = false) {
    const savedCallback = useRef();
    const timeoutId = useRef();
    
    // 保存最新的回调函数
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    
    // 立即执行
    const execute = useCallback(() => {
        if (savedCallback.current) {
            savedCallback.current();
        }
    }, []);
    
    // 设置定时器
    const set = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        
        timeoutId.current = setTimeout(() => {
            execute();
        }, delay);
    }, [delay, execute]);
    
    // 取消定时器
    const clear = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
            timeoutId.current = null;
        }
    }, []);
    
    // 重置定时器
    const reset = useCallback(() => {
        clear();
        set();
    }, [clear, set]);
    
    // 自动设置定时器
    useEffect(() => {
        if (immediate) {
            execute();
        }
        
        if (delay !== null) {
            set();
            return clear;
        }
    }, [delay, immediate, set, clear, execute]);
    
    return { execute, clear, reset };
}

// 使用示例
function AdvancedTimer() {
    const [count, setCount] = useState(0);
    
    const { execute, clear, reset } = useTimeoutEnhanced(
        () => setCount(c => c + 1),
        2000,
        true // 立即执行一次
    );
    
    return (
        <div>
            <div>Count: {count}</div>
            <button onClick={execute}>立即执行</button>
            <button onClick={clear}>取消定时器</button>
            <button onClick={reset}>重置定时器</button>
        </div>
    );
}
```

### 2. 支持动态延迟时间
```javascript
import { useEffect, useRef, useState } from 'react';

function useTimeoutDynamic(callback, initialDelay) {
    const savedCallback = useRef();
    const [delay, setDelay] = useState(initialDelay);
    const timeoutId = useRef();
    
    // 保存最新的回调函数
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    
    // 设置定时器
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        
        if (delay !== null) {
            timeoutId.current = setTimeout(tick, delay);
            return () => {
                if (timeoutId.current) {
                    clearTimeout(timeoutId.current);
                }
            };
        }
    }, [delay]);
    
    // 更新延迟时间
    const updateDelay = useCallback((newDelay) => {
        setDelay(newDelay);
    }, []);
    
    // 立即执行并重新设置定时器
    const executeAndReset = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        
        savedCallback.current();
        
        if (delay !== null) {
            timeoutId.current = setTimeout(() => {
                savedCallback.current();
            }, delay);
        }
    }, [delay]);
    
    return { updateDelay, executeAndReset };
}

// 使用示例
function DynamicTimer() {
    const [count, setCount] = useState(0);
    const [currentDelay, setCurrentDelay] = useState(1000);
    
    const { updateDelay, executeAndReset } = useTimeoutDynamic(
        () => setCount(c => c + 1),
        currentDelay
    );
    
    const handleDelayChange = (newDelay) => {
        setCurrentDelay(newDelay);
        updateDelay(newDelay);
    };
    
    return (
        <div>
            <div>Count: {count}</div>
            <div>当前延迟: {currentDelay}ms</div>
            <button onClick={() => handleDelayChange(500)}>设置为500ms</button>
            <button onClick={() => handleDelayChange(2000)}>设置为2000ms</button>
            <button onClick={executeAndReset}>立即执行并重置</button>
        </div>
    );
}
```

## 三、性能优化实现

### 1. 使用 useMemo 优化
```javascript
import { useEffect, useRef, useMemo, useCallback } from 'react';

function useTimeoutOptimized(callback, delay) {
    const savedCallback = useRef();
    
    // 使用 useMemo 优化回调函数
    const memoizedCallback = useMemo(() => callback, [callback]);
    
    // 保存最新的回调函数
    useEffect(() => {
        savedCallback.current = memoizedCallback;
    }, [memoizedCallback]);
    
    // 使用 useCallback 优化定时器设置
    const setupTimeout = useCallback(() => {
        if (delay === null) return null;
        
        const id = setTimeout(() => {
            savedCallback.current();
        }, delay);
        
        return id;
    }, [delay]);
    
    // 设置定时器
    useEffect(() => {
        const id = setupTimeout();
        return () => {
            if (id) clearTimeout(id);
        };
    }, [setupTimeout]);
}
```

### 2. 支持批量操作
```javascript
import { useEffect, useRef, useState } from 'react';

function useTimeoutBatch(callbacks, delays) {
    const savedCallbacks = useRef([]);
    const timeoutIds = useRef([]);
    const [isActive, setIsActive] = useState(true);
    
    // 保存回调函数
    useEffect(() => {
        savedCallbacks.current = callbacks;
    }, [callbacks]);
    
    // 设置多个定时器
    useEffect(() => {
        if (!isActive) {
            // 清除所有定时器
            timeoutIds.current.forEach(id => clearTimeout(id));
            timeoutIds.current = [];
            return;
        }
        
        // 设置定时器
        const newTimeoutIds = [];
        savedCallbacks.current.forEach((callback, index) => {
            if (delays[index] !== null) {
                const id = setTimeout(() => {
                    callback();
                }, delays[index]);
                newTimeoutIds.push(id);
            }
        });
        
        timeoutIds.current = newTimeoutIds;
        
        // 清理函数
        return () => {
            newTimeoutIds.forEach(id => clearTimeout(id));
        };
    }, [delays, isActive]);
    
    // 批量控制
    const pauseAll = () => setIsActive(false);
    const resumeAll = () => setIsActive(true);
    const clearAll = () => {
        timeoutIds.current.forEach(id => clearTimeout(id));
        timeoutIds.current = [];
    };
    
    return { pauseAll, resumeAll, clearAll, isActive };
}

// 使用示例
function BatchTimer() {
    const [count1, setCount1] = useState(0);
    const [count2, setCount2] = useState(0);
    
    const callbacks = [
        () => setCount1(c => c + 1),
        () => setCount2(c => c + 2)
    ];
    
    const delays = [1000, 2000];
    
    const { pauseAll, resumeAll, clearAll, isActive } = useTimeoutBatch(callbacks, delays);
    
    return (
        <div>
            <div>计数器1: {count1}</div>
            <div>计数器2: {count2}</div>
            <button onClick={pauseAll} disabled={!isActive}>暂停所有</button>
            <button onClick={resumeAll} disabled={isActive}>继续所有</button>
            <button onClick={clearAll}>清除所有</button>
        </div>
    );
}
```

## 四、实际应用场景

### 1. 搜索框防抖
```javascript
function SearchComponent() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    
    // 使用 useTimeout 实现防抖
    useTimeout(() => {
        if (query) {
            // 模拟搜索 API 调用
            fetch(`/api/search?q=${query}`)
                .then(response => response.json())
                .then(data => setResults(data));
        }
    }, 300);
    
    return (
        <div>
            <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索..."
            />
            <ul>
                {results.map(result => (
                    <li key={result.id}>{result.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

### 2. 自动保存功能
```javascript
function AutoSaveEditor() {
    const [content, setContent] = useState('');
    const [lastSaved, setLastSaved] = useState(null);
    
    // 自动保存
    useTimeout(() => {
        if (content) {
            // 模拟保存 API 调用
            fetch('/api/save', {
                method: 'POST',
                body: JSON.stringify({ content })
            }).then(() => {
                setLastSaved(new Date());
            });
        }
    }, 2000);
    
    return (
        <div>
            <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始编辑..."
                rows={10}
                cols={50}
            />
            {lastSaved && (
                <div>最后保存时间: {lastSaved.toLocaleTimeString()}</div>
            )}
        </div>
    );
}
```

### 3. 轮播图组件
```javascript
function Carousel({ items, interval = 3000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // 自动轮播
    useTimeout(() => {
        setCurrentIndex((prevIndex) => 
            prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
    }, interval);
    
    const goToSlide = (index) => {
        setCurrentIndex(index);
    };
    
    return (
        <div className="carousel">
            <div className="carousel-content">
                {items[currentIndex]}
            </div>
            <div className="carousel-indicators">
                {items.map((_, index) => (
                    <button
                        key={index}
                        className={index === currentIndex ? 'active' : ''}
                        onClick={() => goToSlide(index)}
                    >
                        ●
                    </button>
                ))}
            </div>
        </div>
    );
}
```

useTimeout Hook 的实现是 React 开发中的重要技能，掌握这些技巧能够帮助你编写更高效、更健壮的前端应用。