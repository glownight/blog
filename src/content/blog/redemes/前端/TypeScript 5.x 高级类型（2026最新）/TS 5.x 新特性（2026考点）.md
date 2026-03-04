---
title: "TS 5.x 新特性（2026考点）"
publishDate: 2026-02-22 11:50:06
tags: 
  - TypeScript
language: '中文'
---

## 一、装饰器元数据（Decorator Metadata）

### 1. 标准装饰器实现
```typescript
// TypeScript 5.x 标准装饰器
function log(target: any, context: ClassFieldDecoratorContext) {
    return function (this: any, value: string) {
        console.log(`Setting ${context.name} to ${value}`);
        return value;
    };
}

class User {
    @log
    name: string = '';
    
    constructor(name: string) {
        this.name = name;
    }
}

// 使用
const user = new User('Alice');
// 输出: Setting name to Alice
```

### 2. 元数据反射 API
```typescript
// 启用装饰器元数据
// tsconfig.json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}

// 使用反射元数据
import "reflect-metadata";

function Column(type: string) {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata("design:type", type, target, propertyKey);
    };
}

class Entity {
    @Column('string')
    name: string;
    
    @Column('number')
    age: number;
}

// 获取元数据
const nameType = Reflect.getMetadata("design:type", Entity.prototype, 'name');
console.log(nameType); // string
```

## 二、const 类型参数（const Type Parameters）

### 1. const 断言改进
```typescript
// TypeScript 5.x const 类型参数
function createConfig<T extends readonly any[]>(config: T): T {
    return config;
}

// 之前需要 as const
const config1 = createConfig(['api', 'v1', 'users'] as const);
// config1 类型: readonly ["api", "v1", "users"]

// TypeScript 5.x 自动推断
const config2 = createConfig(['api', 'v1', 'users']);
// config2 类型: readonly ["api", "v1", "users"]
```

### 2. 更精确的元组类型推断
```typescript
// 改进的元组类型推断
function tuple<T extends readonly any[]>(...args: T): T {
    return args;
}

// TypeScript 5.x 推断更精确
const result = tuple('hello', 42, true);
// result 类型: readonly ["hello", 42, true]

// 之前版本推断为: (string | number | boolean)[]
```

## 三、模块解析改进

### 1. moduleResolution: "bundler"
```typescript
// tsconfig.json 新配置
{
    "compilerOptions": {
        "moduleResolution": "bundler",
        "module": "esnext",
        "target": "es2022"
    }
}

// 支持现代打包器的模块解析
// 更好的 tree-shaking 支持
// 更快的编译速度
```

### 2. 导入属性（Import Attributes）
```typescript
// 导入属性支持
import jsonData from './data.json' with { type: 'json' };
import wasmModule from './module.wasm' with { type: 'webassembly' };

// 类型安全验证
interface ImportAttributes {
    type: 'json' | 'css' | 'webassembly';
}

// 编译器会验证属性类型
```

## 四、性能优化特性

### 1. 增量构建改进
```typescript
// 更快的增量编译
// TypeScript 5.x 改进了项目引用和构建缓存

// tsconfig.json
{
    "compilerOptions": {
        "incremental": true,
        "tsBuildInfoFile": "./.tsbuildinfo"
    },
    "references": [
        { "path": "./packages/core" },
        { "path": "./packages/utils" }
    ]
}
```

### 2. 内存使用优化
```typescript
// 减少内存占用
// TypeScript 5.x 优化了类型检查器的内存使用

// 大型项目编译性能提升显著
// 更好的垃圾回收机制
```

## 五、类型系统增强

### 1. 模板字符串类型改进
```typescript
// 更强大的模板字符串类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type ApiPath = `/api/${string}`;

type ApiEndpoint = `${HttpMethod} ${ApiPath}`;

// 使用示例
function request(endpoint: ApiEndpoint) {
    // 类型安全的 API 端点
}

request('GET /api/users'); // ✅
request('POST /api/posts'); // ✅
request('PATCH /api/users'); // ❌ PATCH 不是有效的 HttpMethod
```

### 2. 条件类型性能优化
```typescript
// 条件类型推断改进
type ExtractString<T> = T extends string ? T : never;

// TypeScript 5.x 优化了复杂条件类型的性能
type DeepExtractStrings<T> = T extends string
    ? T
    : T extends object
    ? { [K in keyof T]: DeepExtractStrings<T[K]> }
    : never;

// 大型对象类型推断更快
```

TypeScript 5.x 的新特性显著提升了开发体验和类型安全性。