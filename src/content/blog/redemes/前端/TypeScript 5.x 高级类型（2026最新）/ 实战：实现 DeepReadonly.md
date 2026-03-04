---
title: "实战：实现 DeepReadonly"
publishDate: 2025-07-15 05:01:36
tags: 
  - TypeScript
language: '中文'
---

## 一、基础 Readonly 类型

### 1. TypeScript 内置 Readonly
```typescript
// 内置 Readonly 类型
interface User {
    name: string;
    age: number;
    profile: {
        email: string;
        avatar: string;
    };
}

// 浅层只读
type ReadonlyUser = Readonly<User>;

// 测试
const user: ReadonlyUser = {
    name: '张三',
    age: 25,
    profile: {
        email: 'zhangsan@example.com',
        avatar: 'avatar.jpg'
    }
};

user.name = '李四'; // ❌ 错误：name 是只读的
user.profile.email = 'lisi@example.com'; // ✅ 可以修改
// 问题：嵌套对象没有被只读化
```

### 2. 递归类型基础
```typescript
// 条件类型
type IsPrimitive<T> = T extends string | number | boolean | symbol | null | undefined 
    ? true 
    : false;

// 类型守卫
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

// 数组类型判断
type IsArray<T> = T extends any[] ? true : false;
```

## 二、DeepReadonly 实现

### 1. 基础实现版本
```typescript
// 第一版：基础递归实现
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object
        ? T[P] extends Function
            ? T[P]
            : DeepReadonly<T[P]>
        : T[P];
};

// 测试用例
interface TestData {
    a: number;
    b: string;
    c: {
        d: boolean;
        e: {
            f: number[];
        };
    };
    g: () => void;
}

type ReadonlyTest = DeepReadonly<TestData>;

// 验证
const test: ReadonlyTest = {
    a: 1,
    b: 'hello',
    c: {
        d: true,
        e: {
            f: [1, 2, 3]
        }
    },
    g: () => {}
};

test.a = 2; // ❌ 错误
test.c.d = false; // ❌ 错误
test.c.e.f.push(4); // ❌ 错误
test.g(); // ✅ 可以调用
```

### 2. 处理数组和元组
```typescript
// 第二版：支持数组和元组
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends Function
        ? T[P]
        : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

// 处理数组
type DeepReadonlyArray<T> = T extends any[] 
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : DeepReadonly<T>;

// 完整版本
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends Function
        ? T[P]
        : T[P] extends object
        ? T[P] extends any[]
            ? DeepReadonlyArray<T[P]>
            : DeepReadonly<T[P]>
        : T[P];
};

// 测试数组
interface ArrayData {
    numbers: number[];
    users: Array<{ name: string; age: number }>;
    tuple: [string, number, boolean];
}

type ReadonlyArrayData = DeepReadonly<ArrayData>;

const data: ReadonlyArrayData = {
    numbers: [1, 2, 3],
    users: [{ name: 'Alice', age: 25 }],
    tuple: ['hello', 42, true]
};

data.numbers.push(4); // ❌ 错误
data.users[0].name = 'Bob'; // ❌ 错误
data.tuple[0] = 'world'; // ❌ 错误
```

### 3. 处理 Map 和 Set
```typescript
// 第三版：支持 Map 和 Set
type DeepReadonly<T> = T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends Set<infer U>
    ? ReadonlySet<DeepReadonly<U>>
    : T extends Function
    ? T
    : T extends object
    ? {
          readonly [P in keyof T]: DeepReadonly<T[P]>;
      }
    : T;

// 测试 Map 和 Set
interface CollectionData {
    map: Map<string, { value: number }>;
    set: Set<{ id: number; name: string }>;
}

type ReadonlyCollection = DeepReadonly<CollectionData>;

const collection: ReadonlyCollection = {
    map: new Map([['key', { value: 1 }]]),
    set: new Set([{ id: 1, name: 'test' }])
};

collection.map.set('new', { value: 2 }); // ❌ 错误
collection.map.get('key')!.value = 3; // ❌ 错误
collection.set.add({ id: 2, name: 'new' }); // ❌ 错误
```

## 三、性能优化与边界处理

### 1. 避免无限递归
```typescript
// 使用类型层级限制
type DeepReadonly<T, Depth extends number = 10> = 
    Depth extends 0 
        ? T 
        : {
            readonly [P in keyof T]: T[P] extends Function
                ? T[P]
                : T[P] extends object
                ? DeepReadonly<T[P], Subtract<Depth, 1>>
                : T[P];
        };

// 数字减法类型（简化版）
type Subtract<N extends number, M extends number> = 
    // 实际实现需要更复杂的类型运算
    // 这里使用简化版本
    N;
```

### 2. 处理循环引用
```typescript
// 使用 WeakMap 模拟（运行时）
const readonlyCache = new WeakMap<object, any>();

function createDeepReadonly<T extends object>(obj: T): DeepReadonly<T> {
    if (readonlyCache.has(obj)) {
        return readonlyCache.get(obj);
    }
    
    const proxy = new Proxy(obj, {
        get(target, prop) {
            const value = Reflect.get(target, prop);
            if (typeof value === 'object' && value !== null) {
                return createDeepReadonly(value);
            }
            return value;
        },
        set() {
            throw new Error('Cannot assign to read-only property');
        }
    });
    
    readonlyCache.set(obj, proxy);
    return proxy as DeepReadonly<T>;
}
```

## 四、实际应用场景

### 1. Redux 状态管理
```typescript
// Redux 状态类型
interface AppState {
    user: {
        profile: {
            name: string;
            email: string;
            preferences: {
                theme: 'light' | 'dark';
                language: string;
            };
        };
        settings: {
            notifications: boolean;
            privacy: {
                shareData: boolean;
            };
        };
    };
    todos: Array<{
        id: number;
        text: string;
        completed: boolean;
    }>;
}

// 只读状态类型
type ReadonlyAppState = DeepReadonly<AppState>;

// Reducer 中使用
function todoReducer(state: ReadonlyAppState, action: AnyAction): ReadonlyAppState {
    // state 是深度只读的，防止意外修改
    switch (action.type) {
        case 'ADD_TODO':
            // 必须返回新对象
            return {
                ...state,
                todos: [...state.todos, action.payload]
            };
        default:
            return state;
    }
}
```

### 2. 配置对象
```typescript
// 应用配置
interface AppConfig {
    api: {
        baseUrl: string;
        endpoints: {
            users: string;
            posts: string;
            comments: string;
        };
        timeout: number;
    };
    features: {
        darkMode: boolean;
        analytics: {
            enabled: boolean;
            providers: string[];
        };
    };
}

// 只读配置
type ReadonlyConfig = DeepReadonly<AppConfig>;

const config: ReadonlyConfig = {
    api: {
        baseUrl: 'https://api.example.com',
        endpoints: {
            users: '/users',
            posts: '/posts',
            comments: '/comments'
        },
        timeout: 5000
    },
    features: {
        darkMode: true,
        analytics: {
            enabled: false,
            providers: ['google', 'amplitude']
        }
    }
};

// 防止配置被意外修改
config.api.baseUrl = 'https://malicious.com'; // ❌ 编译错误
```

### 3. 组件 Props
```typescript
// React 组件 Props
interface UserProfileProps {
    user: {
        id: number;
        name: string;
        profile: {
            avatar: string;
            bio: string;
            social: {
                twitter?: string;
                github?: string;
            };
        };
        preferences: {
            theme: string;
            notifications: boolean;
        };
    };
    settings: {
        readonly: boolean;
        allowEdit: boolean;
    };
}

// 只读 Props
type ReadonlyUserProfileProps = DeepReadonly<UserProfileProps>;

const UserProfile: React.FC<ReadonlyUserProfileProps> = ({ user, settings }) => {
    // 组件内部无法修改 props
    // user.name = 'New Name'; // ❌ 编译错误
    
    return (
        <div>
            <h1>{user.name}</h1>
            <p>{user.profile.bio}</p>
        </div>
    );
};
```

## 五、进阶技巧

### 1. 选择性只读
```typescript
// 部分属性只读
type PartialReadonly<T, K extends keyof T> = 
    Readonly<Pick<T, K>> & Omit<T, K>;

// 深度部分只读
type DeepPartialReadonly<T, K extends keyof T> = {
    readonly [P in K]: DeepReadonly<T[P]>;
} & {
    [P in Exclude<keyof T, K>]: T[P];
};

// 使用示例
interface Product {
    id: number;
    name: string;
    price: number;
    details: {
        description: string;
        specifications: string[];
    };
}

// 只有 id 和 details 是深度只读的
type ReadonlyProduct = DeepPartialReadonly<Product, 'id' | 'details'>;
```

### 2. 与其它工具类型结合
```typescript
// 与 Required 结合
type DeepRequiredReadonly<T> = DeepReadonly<Required<T>>;

// 与 Partial 结合
type DeepPartialReadonly<T> = DeepReadonly<Partial<T>>;

// 与 Pick 结合
type DeepPickReadonly<T, K extends keyof T> = DeepReadonly<Pick<T, K>>;

// 与 Omit 结合
type DeepOmitReadonly<T, K extends keyof T> = DeepReadonly<Omit<T, K>>;
```

DeepReadonly 的实现展示了 TypeScript 类型系统的强大能力，通过递归和条件类型，我们可以创建出既安全又灵活的类型约束。