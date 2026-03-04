---
title: "Webpack 5 模块联邦（Module Federation）"
publishDate: 2025-06-29 07:12:50
tags: 
  - 工程化
language: '中文'
---

## 一、模块联邦核心概念

### 1. 模块联邦解决的问题
```javascript
// 传统微前端的问题
const traditionalMicroFrontendIssues = {
    // 1. 重复依赖：每个子应用都需要打包相同的依赖
    duplicateDependencies: true,
    
    // 2. 独立部署困难：需要复杂的构建和部署流程
    deploymentComplexity: true,
    
    // 3. 运行时隔离：样式和脚本冲突
    runtimeIsolation: true,
    
    // 4. 开发体验差：需要启动多个开发服务器
    developmentExperience: 'poor'
};

// 模块联邦的优势
const moduleFederationAdvantages = {
    // 1. 运行时模块共享：避免重复打包
    runtimeSharing: true,
    
    // 2. 独立部署：每个应用可以独立部署
    independentDeployment: true,
    
    // 3. 类型安全：TypeScript 支持
    typeSafety: true,
    
    // 4. 开发体验优秀：热更新和模块热替换
    developmentExperience: 'excellent'
};
```

### 2. 模块联邦基本配置
```javascript
// 主应用配置 (host)
const { ModuleFederationPlugin } = require('webpack');

module.exports = {
    plugins: [
        new ModuleFederationPlugin({
            name: 'host', // 应用名称
            remotes: {
                // 远程模块配置
                app1: 'app1@http://localhost:3001/remoteEntry.js',
                app2: 'app2@http://localhost:3002/remoteEntry.js'
            },
            shared: {
                // 共享依赖
                react: {
                    singleton: true, // 单例模式
                    requiredVersion: '^18.0.0'
                },
                'react-dom': {
                    singleton: true,
                    requiredVersion: '^18.0.0'
                }
            }
        })
    ]
};

// 子应用配置 (remote)
module.exports = {
    plugins: [
        new ModuleFederationPlugin({
            name: 'app1',
            filename: 'remoteEntry.js', // 远程入口文件
            exposes: {
                // 暴露的模块
                './Button': './src/components/Button',
                './Header': './src/components/Header',
                './utils': './src/utils'
            },
            shared: {
                react: { singleton: true },
                'react-dom': { singleton: true }
            }
        })
    ]
};
```

## 二、模块联邦实现原理

### 1. 运行时模块加载机制
```javascript
// 模块联邦运行时加载器
class FederationRuntime {
    constructor() {
        this.remotes = new Map(); // 远程模块缓存
        this.shared = new Map(); // 共享模块缓存
        this.initPromise = null; // 初始化 Promise
    }
    
    // 初始化远程模块
    async initRemote(remoteName, remoteUrl) {
        if (this.remotes.has(remoteName)) {
            return this.remotes.get(remoteName);
        }
        
        // 加载远程入口文件
        const remoteEntry = await this.loadScript(remoteUrl);
        
        // 初始化远程模块
        const remote = {
            get: (modulePath) => {
                return remoteEntry.get(modulePath).then(factory => factory());
            },
            init: (shareScope) => {
                return remoteEntry.init(shareScope);
            }
        };
        
        this.remotes.set(remoteName, remote);
        return remote;
    }
    
    // 动态加载模块
    async loadModule(remoteName, modulePath) {
        const remote = await this.initRemote(remoteName);
        return remote.get(modulePath);
    }
}

// 全局运行时实例
window.federationRuntime = new FederationRuntime();
```

### 2. 共享依赖管理
```javascript
// 共享依赖管理器
class SharedDependencyManager {
    constructor() {
        this.scope = 'default';
        this.shared = new Map();
        this.initialized = false;
    }
    
    // 初始化共享作用域
    async init(shareScope) {
        if (this.initialized) return;
        
        this.scope = shareScope;
        
        // 注册共享模块
        for (const [name, config] of Object.entries(shareScope)) {
            this.registerSharedModule(name, config);
        }
        
        this.initialized = true;
    }
    
    // 注册共享模块
    registerSharedModule(name, config) {
        if (this.shared.has(name)) {
            // 版本冲突处理
            this.handleVersionConflict(name, config);
            return;
        }
        
        this.shared.set(name, {
            ...config,
            loaded: false,
            promise: null
        });
    }
    
    // 获取共享模块
    async getSharedModule(name) {
        const moduleInfo = this.shared.get(name);
        
        if (!moduleInfo) {
            throw new Error(`Shared module ${name} not found`);
        }
        
        if (moduleInfo.loaded) {
            return moduleInfo.module;
        }
        
        if (!moduleInfo.promise) {
            moduleInfo.promise = this.loadSharedModule(name, moduleInfo);
        }
        
        return moduleInfo.promise;
    }
    
    // 加载共享模块
    async loadSharedModule(name, moduleInfo) {
        try {
            const module = await moduleInfo.get();
            moduleInfo.module = module;
            moduleInfo.loaded = true;
            return module;
        } catch (error) {
            moduleInfo.promise = null;
            throw error;
        }
    }
}
```

## 三、高级配置与优化

### 1. 生产环境配置
```javascript
// 生产环境模块联邦配置
const productionConfig = {
    // 主应用
    host: {
        remotes: {
            app1: `app1@${process.env.APP1_URL}/remoteEntry.js`,
            app2: `app2@${process.env.APP2_URL}/remoteEntry.js`
        },
        shared: {
            react: {
                singleton: true,
                requiredVersion: '^18.0.0',
                eager: false // 延迟加载
            },
            'react-dom': {
                singleton: true,
                requiredVersion: '^18.0.0',
                eager: false
            }
        }
    },
    
    // 子应用
    remote: {
        exposes: {
            './components/*': './src/components/*',
            './pages/*': './src/pages/*'
        },
        shared: {
            react: {
                singleton: true,
                import: 'react', // 明确指定导入路径
                shareKey: 'react', // 共享键
                shareScope: 'default', // 共享作用域
                version: '^18.0.0'
            }
        }
    }
};
```

### 2. TypeScript 支持
```typescript
// 类型定义文件
declare module 'app1/Button' {
    import { ComponentType } from 'react';
    
    interface ButtonProps {
        onClick?: () => void;
        children: React.ReactNode;
        variant?: 'primary' | 'secondary';
    }
    
    const Button: ComponentType<ButtonProps>;
    export default Button;
}

// 动态导入类型
const loadRemoteModule = async <T>(
    remoteName: string, 
    modulePath: string
): Promise<T> => {
    const container = window[remoteName];
    const factory = await container.get(modulePath);
    return factory();
};

// 使用示例
const Button = await loadRemoteModule<typeof import('app1/Button')>('app1', './Button');
```

### 3. 性能优化策略
```javascript
// 1. 按需加载配置
const lazyRemoteConfig = {
    remotes: {
        app1: {
            external: 'app1',
            url: 'http://localhost:3001/remoteEntry.js',
            loadType: 'lazy' // 延迟加载
        }
    }
};

// 2. 预加载策略
const preloadConfig = {
    plugins: [
        new ModuleFederationPlugin({
            name: 'host',
            remotes: {
                app1: {
                    external: 'app1',
                    url: 'http://localhost:3001/remoteEntry.js',
                    preload: true // 预加载
                }
            }
        })
    ]
};

// 3. 缓存策略
const cacheConfig = {
    shared: {
        react: {
            singleton: true,
            version: '^18.0.0',
            cache: {
                maxAge: 1000 * 60 * 5 // 5分钟缓存
            }
        }
    }
};
```

## 四、实际应用场景

### 1. 微前端架构实现
```javascript
// 微前端主应用
class MicroFrontendHost {
    constructor() {
        this.apps = new Map();
        this.currentApp = null;
    }
    
    // 注册微应用
    registerApp(name, config) {
        this.apps.set(name, config);
    }
    
    // 加载微应用
    async loadApp(name) {
        const config = this.apps.get(name);
        
        if (!config) {
            throw new Error(`App ${name} not found`);
        }
        
        // 卸载当前应用
        if (this.currentApp) {
            await this.unloadApp(this.currentApp);
        }
        
        // 加载远程模块
        const AppComponent = await window.federationRuntime.loadModule(
            config.remoteName,
            config.modulePath
        );
        
        // 渲染应用
        this.renderApp(AppComponent, config.container);
        this.currentApp = name;
    }
    
    // 渲染应用
    renderApp(Component, container) {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(Component));
    }
}

// 使用示例
const host = new MicroFrontendHost();
host.registerApp('dashboard', {
    remoteName: 'dashboardApp',
    modulePath: './Dashboard',
    container: document.getElementById('app-container')
});
```

### 2. 组件库共享
```javascript
// 共享组件库配置
const componentLibraryConfig = {
    name: 'ui-library',
    filename: 'remoteEntry.js',
    exposes: {
        // 基础组件
        './Button': './src/components/Button',
        './Input': './src/components/Input',
        './Modal': './src/components/Modal',
        
        // 业务组件
        './UserProfile': './src/business/UserProfile',
        './ProductCard': './src/business/ProductCard'
    },
    shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'styled-components': { singleton: true }
    }
};

// 业务应用使用共享组件
const { Button, Modal } = await Promise.all([
    import('ui-library/Button'),
    import('ui-library/Modal')
]);
```

### 3. 工具函数共享
```javascript
// 工具库配置
const utilsLibraryConfig = {
    name: 'utils',
    filename: 'remoteEntry.js',
    exposes: {
        './date': './src/utils/date',
        './format': './src/utils/format',
        './validation': './src/utils/validation',
        './api': './src/utils/api'
    },
    shared: {
        lodash: {
            singleton: true,
            requiredVersion: '^4.17.0'
        }
    }
};

// 使用共享工具
const { formatCurrency, validateEmail } = await Promise.all([
    import('utils/format'),
    import('utils/validation')
]);
```

## 五、调试与问题排查

### 1. 开发工具配置
```javascript
// Webpack 开发服务器配置
const devServerConfig = {
    devServer: {
        port: 3000,
        headers: {
            'Access-Control-Allow-Origin': '*', // CORS 配置
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        },
        hot: true, // 热更新
        liveReload: false
    }
};

// 模块联邦调试配置
const debugConfig = {
    plugins: [
        new ModuleFederationPlugin({
            name: 'debug-host',
            remotes: {
                app1: {
                    external: 'app1',
                    url: 'http://localhost:3001/remoteEntry.js',
                    debug: true // 启用调试模式
                }
            }
        })
    ]
};
```

### 2. 常见问题解决方案
```javascript
// 1. 版本冲突处理
const versionConflictSolution = {
    shared: {
        react: {
            singleton: true,
            requiredVersion: '^18.0.0',
            strictVersion: false, // 允许版本不严格匹配
            version: '18.2.0'
        }
    }
};

// 2. 加载失败重试机制
const retryConfig = {
    remotes: {
        app1: {
            external: 'app1',
            url: 'http://localhost:3001/remoteEntry.js',
            retry: {
                maxAttempts: 3, // 最大重试次数
                delay: 1000 // 重试延迟
            }
        }
    }
};

// 3. 降级策略
const fallbackConfig = {
    remotes: {
        app1: {
            external: 'app1',
            url: 'http://localhost:3001/remoteEntry.js',
            fallback: './fallback/App1Fallback' // 降级组件
        }
    }
};
```

模块联邦技术为前端架构带来了革命性的变化，使得微前端架构更加灵活和高效。