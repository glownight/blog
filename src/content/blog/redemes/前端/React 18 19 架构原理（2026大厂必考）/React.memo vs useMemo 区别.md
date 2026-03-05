---
title: "React.memo vs useMemo 区别"
publishDate: 2025-12-04 23:59:17
tags: 
  - React
language: '中文'
---

## 什么时候该用React.memo？

**React.memo是用来优化组件重渲染的**，不是用来缓存计算结果的。我在项目中总结了一个简单的判断标准：

> 如果一个组件接收的props变化不频繁，但渲染成本较高，就应该考虑使用React.memo。

```javascript
// ✅ 适合使用React.memo的场景：用户信息展示组件
const UserProfile = React.memo(function UserProfile({ user, onEdit }) {
    console.log('UserProfile 渲染 - 用户:', user.name);
    
    // 复杂的渲染逻辑
    const formattedBirthday = new Date(user.birthday).toLocaleDateString();
    const membershipLevel = getUserLevel(user.points);
    
    return (
        <div className="user-profile">
            <Avatar src={user.avatar} size="large" />
            <h3>{user.name}</h3>
            <p>生日: {formattedBirthday}</p>
            <p>会员等级: {membershipLevel}</p>
            <button onClick={() => onEdit(user.id)}>编辑</button>
        </div>
    );
});

// ❌ 不适合的场景：简单的展示组件
const SimpleLabel = React.memo(function SimpleLabel({ text }) {
    return <span>{text}</span>;
}); // 过度优化，反而增加了复杂度
```

## useMemo的正确使用姿势

**useMemo是用来缓存昂贵计算结果的**，不是用来避免重渲染的。我在性能优化时遵循这个原则：

> 只有当计算成本高于缓存成本时，才使用useMemo。

```javascript
// ✅ 适合使用useMemo的场景：复杂计算
function ProductList({ products, searchTerm, sortBy }) {
    // 昂贵的过滤和排序计算
    const filteredProducts = useMemo(() => {
        console.time('过滤产品');
        
        let result = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // 复杂的排序逻辑
        result.sort((a, b) => {
            if (sortBy === 'price') return a.price - b.price;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
        
        console.timeEnd('过滤产品');
        return result;
    }, [products, searchTerm, sortBy]);
    
    return (
        <div>
            {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

// ❌ 不适合的场景：简单计算
function SimpleComponent({ a, b }) {
    const sum = useMemo(() => a + b, [a, b]); // 过度优化
    return <div>{sum}</div>;
}
```

## 实际项目中的性能陷阱

在最近的项目性能优化中，我发现了几个常见的性能陷阱：

### 1. 滥用React.memo导致的问题

```javascript
// ❌ 错误用法：memo包装了频繁变化的组件
const SearchResults = React.memo(function SearchResults({ results, onSelect }) {
    // results数组每次都是新的引用，memo完全失效
    return (
        <div>
            {results.map(item => (
                <SearchResultItem 
                    key={item.id} 
                    item={item}
                    onSelect={onSelect} // 函数也是新的引用
                />
            ))}
        </div>
    );
});

// ✅ 正确用法：配合useMemo和useCallback
function SearchResultsContainer({ rawResults, onSelect }) {
    // 缓存结果数组
    const results = useMemo(() => 
        rawResults.map(item => ({ ...item, processed: true })), 
        [rawResults]
    );
    
    // 缓存回调函数
    const handleSelect = useCallback((item) => {
        onSelect(item.id);
    }, [onSelect]);
    
    return (
        <SearchResults 
            results={results} 
            onSelect={handleSelect} 
        />
    );
}
```

### 2. useMemo的依赖数组陷阱

```javascript
// ❌ 错误的依赖数组
function ProductFilters({ products, filters }) {
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === '') return true;
                return product[key] === value;
            });
        });
    }, [products]); // 漏掉了filters依赖！
    
    return <ProductList products={filteredProducts} />;
}

// ✅ 正确的依赖数组
function ProductFilters({ products, filters }) {
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === '') return true;
                return product[key] === value;
            });
        });
    }, [products, filters]); // 包含所有依赖
    
    return <ProductList products={filteredProducts} />;
}
```

## 性能优化的黄金法则

基于我在多个大型项目中的经验，总结出以下优化法则：

### 1. 测量优先原则

**不要盲目优化，先用React DevTools测量性能瓶颈**

```javascript
// 使用React DevTools的Profiler
function App() {
    return (
        <Profiler id="ProductList" onRender={onRenderCallback}>
            <ProductList products={products} />
        </Profiler>
    );
}

function onRenderCallback(id, phase, actualDuration, baseDuration) {
    console.log(`${id} 渲染耗时:`, actualDuration);
    if (actualDuration > 16) { // 超过一帧时间
        console.warn('性能警告：', id, '渲染过慢');
    }
}
```

### 2. 渐进优化策略

**从性能瓶颈最大的组件开始优化**

```javascript
// 优化优先级排序
const optimizationPriority = [
    'LargeList',           // 大数据列表
    'ComplexChart',        // 复杂图表
    'FormWithValidation',  // 表单验证
    'ImageGallery',        // 图片库
    'SimpleComponents'     // 简单组件
];
```

## 面试官最爱问的问题

### 问题1："React.memo和PureComponent有什么区别？"

**我的回答思路：**
1. **适用对象**：React.memo用于函数组件，PureComponent用于类组件
2. **比较机制**：两者都使用浅比较，但React.memo可以自定义比较函数
3. **性能影响**：React.memo更轻量，PureComponent有实例化开销
4. **使用场景**：新项目推荐使用React.memo + Hooks

### 问题2："useMemo和useCallback有什么区别？"

**我的回答：**
- **useMemo**：缓存计算结果，返回缓存的值
- **useCallback**：缓存函数本身，返回缓存的函数
- **本质相同**：useCallback(fn, deps) 相当于 useMemo(() => fn, deps)

```javascript
// 两者等价
const memoizedCallback = useCallback(() => {
    doSomething(a, b);
}, [a, b]);

const memoizedCallback = useMemo(() => {
    return () => doSomething(a, b);
}, [a, b]);
```

## 总结：什么时候该优化？

基于我的项目经验，给出以下建议：

### 应该使用优化的情况：
1. **组件渲染成本高**（复杂计算、大量DOM操作）
2. **props变化不频繁**但组件重渲染频繁
3. **列表项数量大**（超过100项）
4. **性能监控显示瓶颈**

### 不应该过度优化的情况：
1. **简单展示组件**（渲染成本低）
2. **props频繁变化**（memo失效）
3. **项目初期**（优先保证功能正确性）
4. **没有性能问题**（不要为了优化而优化）

记住：**性能优化是手段，不是目的**。在真实项目中，我通常先实现功能，再根据性能监控数据有针对性地进行优化。
            continue;
        }
        return false;
    }
    
    return true;
}
```

## 三、应用场景对比

### React.memo 适用场景
```javascript
// 1. 纯展示组件
const UserCard = React.memo(({ user, onClick }) => {
    return (
        <div onClick={() => onClick(user.id)}>
            <img src={user.avatar} alt={user.name} />
            <h4>{user.name}</h4>
            <p>{user.bio}</p>
        </div>
    );
});

// 2. 频繁渲染的列表项
const TodoItem = React.memo(({ todo, onToggle, onDelete }) => {
    return (
        <li className={todo.completed ? 'completed' : ''}>
            <input 
                type="checkbox" 
                checked={todo.completed}
                onChange={() => onToggle(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => onDelete(todo.id)}>删除</button>
        </li>
    );
});

// 3. 大型表单组件
const ComplexForm = React.memo(({ formData, onChange }) => {
    // 复杂的表单逻辑...
    return (
        <form>
            {/* 多个表单字段 */}
        </form>
    );
});
```

### useMemo 适用场景
```javascript
// 1. 昂贵的计算
function ChartComponent({ data, filters }) {
    const processedData = useMemo(() => {
        // 复杂的数据处理逻辑
        return data
            .filter(item => filters.includes(item.category))
            .map(item => ({
                ...item,
                value: calculateComplexValue(item)
            }));
    }, [data, filters]);
    
    return <Chart data={processedData} />;
}

// 2. 对象/数组的创建
function FormComponent({ initialValues }) {
    const formConfig = useMemo(() => ({
        initialValues,
        validate: values => {
            const errors = {};
            if (!values.name) errors.name = '姓名必填';
            if (!values.email) errors.email = '邮箱必填';
            return errors;
        }
    }), [initialValues]);
    
    return <Form {...formConfig} />;
}

// 3. 函数记忆化
function SearchComponent({ query, items }) {
    const searchFunction = useMemo(() => {
        return debounce((searchQuery, itemList) => {
            return itemList.filter(item => 
                item.name.includes(searchQuery)
            );
        }, 300);
    }, []);
    
    const results = searchFunction(query, items);
    
    return <SearchResults results={results} />;
}
```

## 四、性能优化最佳实践

### 1. 避免不必要的优化
```javascript
// 错误用法：过度使用 memo
const SimpleButton = React.memo(({ onClick, children }) => (
    <button onClick={onClick}>{children}</button>
));

// 正确用法：只在必要时使用
const ExpensiveChart = React.memo(({ complexData }) => (
    <ComplexChart data={complexData} />
));
```

### 2. 合理使用依赖数组
```javascript
// 错误用法：缺少依赖
function BadExample({ items }) {
    const processed = useMemo(() => {
        return items.map(item => expensiveTransform(item));
    }, []); // 缺少 items 依赖
    
    return <List items={processed} />;
}

// 正确用法：完整依赖
function GoodExample({ items }) {
    const processed = useMemo(() => {
        return items.map(item => expensiveTransform(item));
    }, [items]); // 正确依赖
    
    return <List items={processed} />;
}
```

### 3. 组合使用优化策略
```javascript
// 组合使用 memo 和 useMemo
const OptimizedUserList = React.memo(({ users, searchTerm, onUserClick }) => {
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const userClickHandler = useCallback((userId) => {
        onUserClick(userId);
    }, [onUserClick]);
    
    return (
        <ul>
            {filteredUsers.map(user => (
                <UserItem 
                    key={user.id} 
                    user={user} 
                    onClick={userClickHandler}
                />
            ))}
        </ul>
    );
});
```

## 五、常见误区与调试技巧

### 1. 调试工具使用
```javascript
// 使用 React DevTools 检查优化效果
import { useWhyDidYouUpdate } from 'ahooks';

function DebugComponent(props) {
    useWhyDidYouUpdate('DebugComponent', props);
    
    return <div>{/* 组件内容 */}</div>;
}

// 自定义调试 Hook
function useRenderCounter(name) {
    const countRef = useRef(0);
    
    useEffect(() => {
        countRef.current++;
        console.log(`${name} 渲染次数:`, countRef.current);
    });
    
    return countRef.current;
}
```

### 2. 性能测量
```javascript
// 使用 React Profiler
function ProfiledComponent() {
    return (
        <React.Profiler 
            id="MyComponent" 
            onRender={(id, phase, actualDuration) => {
                console.log(`${id} ${phase} 耗时:`, actualDuration);
            }}
        >
            <MyComponent />
        </React.Profiler>
    );
}
```

React.memo 和 useMemo 是 React 性能优化的核心工具，正确理解它们的区别和应用场景对于构建高性能 React 应用至关重要。