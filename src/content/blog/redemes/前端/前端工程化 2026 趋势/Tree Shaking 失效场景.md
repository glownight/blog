---
title: "Tree Shaking 失效场景"
publishDate: 2025-06-28 18:23:17
tags: 
  - 工程化
language: '中文'
---

## 一、Tree Shaking 基本原理

### 1. 静态分析机制
```javascript
// 可 Tree Shaking 的代码
import { add, subtract } from './math';

// 只使用 add 函数
console.log(add(1, 2));
// subtract 函数会被移除

// 不可 Tree Shaking 的代码
import * as math from './math';

// 动态使用
const funcName = 'add';
console.log(math[funcName](1, 2));
// 所有导出都会被保留
```

### 2. 构建工具支持
```javascript
// Webpack Tree Shaking 配置
module.exports = {
    mode: 'production',
    optimization: {
        usedExports: true,
        sideEffects: false
    }
};

// Rollup Tree Shaking 配置
export default {
    treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
    }
};
```

## 二、常见失效场景

### 1. 副作用标记问题
```javascript
// package.json 缺少 sideEffects 标记
{
    "name": "my-library",
    "sideEffects": false // 正确标记
}

// 有副作用的模块
// styles.css - 需要标记为有副作用
import './styles.css'; // 如果没有标记，可能被移除

// 初始化代码
import './init'; // 包含全局注册代码
```

### 2. 动态导入和访问
```javascript
// 动态属性访问
import * as utils from './utils';
const func = utils['someFunction']; // 无法静态分析

// 条件导入
if (process.env.NODE_ENV === 'development') {
    require('./dev-tools'); // 无法 Tree Shaking
}

// 动态 import()
const moduleName = './' + dynamicPath;
import(moduleName).then(module => {
    // 无法静态分析
});
```

### 3. CommonJS 模块问题
```javascript
// CommonJS 导出
module.exports = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b
};

// 使用
const { add } = require('./math');
// subtract 无法被移除

// 转译后的代码问题
// Babel 转译可能破坏 ES6 模块结构
```

## 三、解决方案

### 1. 正确的模块导出
```javascript
// 使用命名导出
// math.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// 使用方
import { add } from './math'; // 只有 add 被包含
```

### 2. 副作用标记
```javascript
// package.json
{
    "sideEffects": [
        "**/*.css",
        "**/*.scss",
        "./src/polyfills.js"
    ]
}

// 或者标记为无副作用
{
    "sideEffects": false
}
```

### 3. 构建配置优化
```javascript
// Webpack 高级配置
module.exports = {
    optimization: {
        usedExports: true,
        sideEffects: true,
        providedExports: true,
        concatenateModules: true
    }
};

// 使用 babel-plugin-transform-imports
// 将 import * as 转换为命名导入
```

理解 Tree Shaking 失效场景有助于编写更优化的代码和配置。