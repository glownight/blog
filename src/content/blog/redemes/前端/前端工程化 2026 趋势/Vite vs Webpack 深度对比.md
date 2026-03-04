---
title: "Vite vs Webpack 深度对比"
publishDate: 2025-06-23 06:22:26
tags: 
  - 工程化
language: '中文'
---

## 一、架构设计对比

### 1. 构建原理差异
```javascript
// Webpack 构建流程
const webpackBuild = {
    // 1. 依赖分析
    entry: './src/index.js',
    // 2. 模块打包
    output: './dist/bundle.js',
    // 3. 代码转换
    loaders: ['babel-loader', 'css-loader'],
    // 4. 优化处理
    plugins: [new TerserPlugin()]
};

// Vite 构建流程
const viteBuild = {
    // 1. 原生 ES 模块
    server: { middleware: 'esbuild' },
    // 2. 按需编译
    build: { rollup: true },
    // 3. 热更新优化
    hmr: { overlay: false }
};
```

### 2. 开发服务器性能
```javascript
// Webpack Dev Server 启动时间
const webpackStartup = {
    time: '10-30s',
    memory: '高',
    rebuild: '2-5s'
};

// Vite Dev Server 启动时间
const viteStartup = {
    time: '1-3s',
    memory: '低',
    rebuild: '50-200ms'
};
```

## 二、配置复杂度对比

### 1. Webpack 配置示例
```javascript
// webpack.config.js
module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new MiniCssExtractPlugin()
    ],
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};
```

### 2. Vite 配置示例
```javascript
// vite.config.js
export default {
    root: './src',
    build: {
        outDir: '../dist',
        rollupOptions: {
            input: {
                main: './src/index.html'
            }
        }
    },
    plugins: [
        vue(),
        legacy({
            targets: ['defaults', 'not IE 11']
        })
    ],
    server: {
        port: 3000,
        open: true
    }
};
```

## 三、生态系统支持

### 1. 插件生态对比
```javascript
// Webpack 插件生态
const webpackPlugins = {
    // 官方插件
    'html-webpack-plugin': 'HTML 模板处理',
    'mini-css-extract-plugin': 'CSS 提取',
    'terser-webpack-plugin': '代码压缩',
    
    // 社区插件
    'webpack-bundle-analyzer': '包分析',
    'copy-webpack-plugin': '文件复制',
    'clean-webpack-plugin': '清理输出目录'
};

// Vite 插件生态
const vitePlugins = {
    // 官方插件
    '@vitejs/plugin-vue': 'Vue 支持',
    '@vitejs/plugin-react': 'React 支持',
    'vite-plugin-pwa': 'PWA 支持',
    
    // 社区插件
    'vite-plugin-svg-icons': 'SVG 图标',
    'unplugin-vue-components': '自动导入组件',
    'vite-plugin-checker': '类型检查'
};
```

## 四、适用场景建议

### 1. 选择 Vite 的场景
```javascript
const viteScenarios = {
    // 1. 新项目开发
    newProjects: true,
    
    // 2. 需要快速启动
    fastStartup: true,
    
    // 3. 现代浏览器目标
    modernBrowsers: true,
    
    // 4. 库开发
    libraryDevelopment: true
};
```

### 2. 选择 Webpack 的场景
```javascript
const webpackScenarios = {
    // 1. 遗留项目迁移
    legacyProjects: true,
    
    // 2. 复杂构建需求
    complexBuilds: true,
    
    // 3. 企业级应用
    enterpriseApps: true,
    
    // 4. 需要深度定制
    deepCustomization: true
};
```

Vite 和 Webpack 各有优势，根据项目需求选择合适的构建工具是关键。