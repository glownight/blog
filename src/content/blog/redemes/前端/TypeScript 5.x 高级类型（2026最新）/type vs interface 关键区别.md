---
title: "type vs interface 关键区别"
publishDate: 2025-07-17 16:19:12
tags: 
  - TypeScript
language: '中文'
---

## 一、基本语法对比

### 1. 基础定义
```typescript
// interface 定义
interface User {
    name: string;
    age: number;
}

// type 定义
type User = {
    name: string;
    age: number;
};

// 使用方式相同
const user1: User = { name: 'Alice', age: 25 };
const user2: User = { name: 'Bob', age: 30 };
```

### 2. 扩展方式
```typescript
// interface 扩展
interface Person {
    name: string;
}

interface User extends Person {
    age: number;
}

// type 扩展
type Person = {
    name: string;
};

type User = Person & {
    age: number;
};

// 混合扩展
interface Admin extends Person {
    role: string;
}

type Manager = Person & {
    department: string;
};
```

## 二、关键区别详解

### 1. 声明合并（Declaration Merging）
```typescript
// interface 支持声明合并
interface User {
    name: string;
}

interface User {
    age: number;
}

// 合并后的 User
const user: User = {
    name: 'Alice',
    age: 25
};

// type 不支持声明合并
type User = {
    name: string;
};

// ❌ 错误：重复标识符
type User = {
    age: number;
};
```

### 2. 扩展能力
```typescript
// interface 扩展 interface
interface Base {
    id: number;
}

interface Derived extends Base {
    name: string;
}

// type 扩展 type
type Base = {
    id: number;
};

type Derived = Base & {
    name: string;
};

// interface 扩展 type
type BaseType = {
    id: number;
};

interface DerivedInterface extends BaseType {
    name: string;
}

// type 扩展 interface
interface BaseInterface {
    id: number;
}

type DerivedType = BaseInterface & {
    name: string;
};
```

### 3. 联合类型和交叉类型
```typescript
// type 支持联合类型
type Status = 'pending' | 'success' | 'error';
type Size = 'small' | 'medium' | 'large';

// type 支持交叉类型
type A = { a: number };
type B = { b: string };
type C = A & B; // { a: number; b: string }

// interface 不支持直接定义联合类型
// ❌ 错误
interface Status {
    'pending' | 'success' | 'error';
}

// 但可以通过扩展实现类似功能
interface PendingStatus {
    status: 'pending';
}

interface SuccessStatus {
    status: 'success';
}

type AnyStatus = PendingStatus | SuccessStatus;
```

## 三、高级特性对比

### 1. 映射类型（Mapped Types）
```typescript
// type 支持映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type Partial<T> = {
    [P in keyof T]?: T[P];
};

// interface 不支持映射类型语法
// ❌ 错误
interface Readonly<T> {
    readonly [P in keyof T]: T[P];
}
```

### 2. 条件类型（Conditional Types）
```typescript
// type 支持条件类型
type IsString<T> = T extends string ? true : false;
type ExtractString<T> = T extends string ? T : never;

// interface 不支持条件类型
// ❌ 错误
interface IsString<T> {
    T extends string ? true : false;
}
```

### 3. 工具类型（Utility Types）
```typescript
// 内置工具类型都是 type
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
type PickUser = Pick<User, 'name'>;
type OmitUser = Omit<User, 'age'>;

// 自定义工具类型
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object 
        ? DeepReadonly<T[P]> 
        : T[P];
};
```

## 四、性能考虑

### 1. 编译时性能
```typescript
// interface 在大型项目中可能有更好的性能
// 因为 TypeScript 可以缓存 interface 结构

// type 在复杂联合类型时可能影响编译性能
type ComplexUnion = 
    | { type: 'A'; data: string }
    | { type: 'B'; data: number }
    | { type: 'C'; data: boolean[] };
```

### 2. 错误信息可读性
```typescript
// interface 错误信息更清晰
interface User {
    name: string;
    age: number;
}

const user: User = { name: 'Alice' };
// 错误：Property 'age' is missing

// type 错误信息可能更复杂
type User = {
    name: string;
    age: number;
};

const user: User = { name: 'Alice' };
// 错误：Type '{ name: string; }' is missing properties
```

## 五、最佳实践建议

### 1. 使用 interface 的场景
```typescript
// 1. 对象类型定义
interface ComponentProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

// 2. 类实现
interface Serializable {
    serialize(): string;
}

class User implements Serializable {
    serialize() {
        return JSON.stringify(this);
    }
}

// 3. 声明合并（库类型扩展）
interface Window {
    myCustomMethod: () => void;
}
```

### 2. 使用 type 的场景
```typescript
// 1. 联合类型
type Action = 'create' | 'read' | 'update' | 'delete';
type Size = number | string;

// 2. 元组类型
type Point = [number, number];
type RGB = [number, number, number];

// 3. 映射类型
type ReadonlyProps<T> = {
    readonly [P in keyof T]: T[P];
};

// 4. 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;
```

### 3. 混合使用策略
```typescript
// 基础类型用 interface
interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

// 复杂类型用 type
type ApiResponse<T> = {
    data: T;
    status: 'success' | 'error';
    message?: string;
};

// 联合类型用 type
type UserRole = 'admin' | 'user' | 'guest';

// 扩展用 interface
interface User extends BaseEntity {
    name: string;
    email: string;
    role: UserRole;
}

// 工具类型用 type
type UserResponse = ApiResponse<User>;
```

## 六、实际应用示例

### 1. React 组件 Props
```typescript
// 使用 interface 定义组件 Props
interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    onClick?: () => void;
}

// 使用 type 定义样式类型
type ButtonStyle = {
    backgroundColor: string;
    color: string;
    padding: string;
};

const Button: React.FC<ButtonProps> = (props) => {
    // 组件实现
    return <button>{props.children}</button>;
};
```

### 2. API 响应类型
```typescript
// 使用 type 定义响应结构
type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    pagination?: {
        page: number;
        total: number;
        hasNext: boolean;
    };
};

// 使用 interface 定义数据模型
interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

// 组合使用
type UserResponse = ApiResponse<User>;
type UsersResponse = ApiResponse<User[]>;
```

### 3. 状态管理类型
```typescript
// 使用 type 定义 Action 类型
type Action = 
    | { type: 'ADD_TODO'; payload: string }
    | { type: 'REMOVE_TODO'; payload: number }
    | { type: 'TOGGLE_TODO'; payload: number };

// 使用 interface 定义 State 类型
interface TodoState {
    todos: Array<{
        id: number;
        text: string;
        completed: boolean;
    }>;
    filter: 'all' | 'active' | 'completed';
}

// Reducer 函数
type TodoReducer = (state: TodoState, action: Action) => TodoState;
```

理解 type 和 interface 的区别有助于在合适的场景选择合适的方式，提高代码的可维护性和类型安全性。