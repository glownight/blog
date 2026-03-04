---
title: "Monorepo 工程组织"
publishDate: 2025-06-19 02:23:45
tags: 
  - 工程化
language: '中文'
---

## 一、Monorepo 核心优势

### 1. 代码共享与复用
```javascript
// 传统多仓库 vs Monorepo
const multiRepo = {
    // 问题：代码重复，版本管理复杂
    app1: { dependencies: { 'shared-utils': '^1.0.0' } },
    app2: { dependencies: { 'shared-utils': '^1.1.0' } },
    sharedUtils: { version: '1.1.0' }
};

const monoRepo = {
    // 优势：直接引用，版本一致
    packages: {
        app1: { dependencies: { 'shared-utils': '*' } },
        app2: { dependencies: { 'shared-utils': '*' } },
        sharedUtils: { version: '1.1.0' }
    }
};
```

### 2. 统一工具链
```javascript
// 统一的构建配置
const buildConfig = {
    // 所有包共享相同的构建配置
    typescript: {
        strict: true,
        target: 'ES2020'
    },
    eslint: {
        extends: ['@company/eslint-config']
    },
    jest: {
        preset: 'ts-jest'
    }
};
```

## 二、主流 Monorepo 工具对比

### 1. Lerna + Yarn Workspaces
```javascript
// lerna.json 配置
{
    "packages": ["packages/*"],
    "version": "independent",
    "npmClient": "yarn",
    "useWorkspaces": true
}

// package.json workspaces 配置
{
    "workspaces": ["packages/*", "apps/*"],
    "scripts": {
        "build": "lerna run build",
        "test": "lerna run test",
        "publish": "lerna publish"
    }
}
```

### 2. Nx 高级功能
```javascript
// nx.json 配置
{
    "tasksRunnerOptions": {
        "default": {
            "runner": "nx/tasks-runners/default",
            "options": {
                "cacheableOperations": ["build", "test", "lint"]
            }
        }
    },
    "affected": {
        "defaultBase": "main"
    }
}

// 任务依赖图
const taskGraph = {
    "app1:build": {
        "dependsOn": ["shared-utils:build", "ui-components:build"]
    },
    "app2:build": {
        "dependsOn": ["shared-utils:build", "ui-components:build"]
    }
};
```

### 3. Turborepo 性能优化
```javascript
// turbo.json 配置
{
    "pipeline": {
        "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**"]
        },
        "test": {
            "dependsOn": ["build"],
            "outputs": []
        },
        "lint": {
            "outputs": []
        }
    }
}
```

## 三、实际应用场景

### 1. 组件库开发
```javascript
// packages 结构
packages/
├── ui-components/     # 基础 UI 组件库
├── business-components/ # 业务组件库
├── utils/            # 工具函数库
├── app-web/          # Web 应用
├── app-mobile/       # 移动端应用
└── docs/             # 文档站点

// 依赖关系
const dependencies = {
    "app-web": {
        "dependencies": {
            "ui-components": "*",
            "business-components": "*",
            "utils": "*"
        }
    },
    "business-components": {
        "dependencies": {
            "ui-components": "*"
        }
    }
};
```

### 2. 微前端架构
```javascript
// 微前端 Monorepo 组织
apps/
├── shell/           # 主应用壳
├── dashboard/       # 仪表板微应用
├── admin/           # 管理后台微应用
├── user-center/     # 用户中心微应用
└── shared/          # 共享资源
    ├── types/       # 类型定义
    ├── utils/       # 工具函数
    └── components/  # 共享组件

// 构建配置
const buildConfig = {
    "shell": {
        "type": "application",
        "externals": ["react", "react-dom"]
    },
    "dashboard": {
        "type": "micro-app",
        "federation": true
    }
};
```

Monorepo 工程组织为大型前端项目提供了高效的代码管理和协作方案。