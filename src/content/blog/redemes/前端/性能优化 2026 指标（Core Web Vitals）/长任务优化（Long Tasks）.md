---
title: 长任务优化（Long Tasks）
publishDate: 2026-03-03
tags:
  - 性能优化
  - Core Web Vitals
  - JavaScript
  - 长任务
  - Web Workers
language: zh-CN
---

## 什么是长任务？

长任务具有以下特征：
- 执行时间超过 50ms
- 阻塞主线程，影响用户交互
- 导致页面卡顿和响应延迟
- 影响 FID（First Input Delay）和 INP（Interaction to Next Paint）指标

## 长任务检测与监控

### 使用 PerformanceObserver 监控长任务

```javascript
// 长任务监控器
class LongTaskMonitor {
    constructor() {
        this.longTasks = [];
        this.observer = null;
        this.threshold = 50; // 50ms 阈值
    }

    // 开始监控
    startMonitoring() {
        if (!window.PerformanceObserver) {
            console.warn('PerformanceObserver not supported');
            return;
        }

        this.observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.duration > this.threshold) {
                    this.handleLongTask(entry);
                }
            });
        });

        this.observer.observe({ entryTypes: ['longtask'] });
    }

    // 处理长任务
    handleLongTask(entry) {
        const longTask = {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution || [],
            stack: this.getStackInfo()
        };

        this.longTasks.push(longTask);
        this.analyzeLongTask(longTask);
        
        // 发送到监控系统
        this.reportLongTask(longTask);
    }

    // 获取调用栈信息
    getStackInfo() {
        try {
            const stack = new Error().stack;
            return stack ? stack.split('\n').slice(2).join('\n') : 'unknown';
        } catch {
            return 'unknown';
        }
    }

    // 分析长任务
    analyzeLongTask(task) {
        const analysis = {
            severity: this.calculateSeverity(task.duration),
            impact: this.estimateImpact(task),
            suggestions: this.generateSuggestions(task)
        };

        console.warn('Long Task Detected:', task, analysis);
        return analysis;
    }

    // 计算严重程度
    calculateSeverity(duration) {
        if (duration > 200) return 'critical';
        if (duration > 100) return 'high';
        if (duration > 50) return 'medium';
        return 'low';
    }
}
```

### 手动检测长任务

```javascript
// 手动长任务检测
function measureTaskExecution(fn, taskName = 'unnamed') {
    const startTime = performance.now();
    
    try {
        return fn();
    } finally {
        const duration = performance.now() - startTime;
        
        if (duration > 50) {
            console.warn(`Long Task: ${taskName} took ${duration.toFixed(2)}ms`);
            
            // 发送性能监控
            if (window.gtag) {
                gtag('event', 'long_task', {
                    'task_name': taskName,
                    'duration': duration,
                    'event_category': 'performance'
                });
            }
        }
    }
}

// 使用示例
const result = measureTaskExecution(() => {
    // 执行可能耗时的操作
    return heavyComputation();
}, 'heavy_computation');
```

## 长任务优化策略

### 1. 任务拆分（Task Splitting）

将长任务拆分为多个小任务，利用 `setTimeout` 或 `requestIdleCallback` 分时执行。

```javascript
// 任务拆分器
class TaskSplitter {
    constructor() {
        this.tasks = [];
        this.currentIndex = 0;
        this.chunkSize = 100; // 每块处理的项目数
        this.timeBudget = 16; // 每帧的时间预算（ms）
    }

    // 添加任务
    addTask(data, processor) {
        this.tasks.push({ data, processor });
    }

    // 分块执行
    async execute() {
        if (this.tasks.length === 0) return;

        const task = this.tasks[0];
        const totalChunks = Math.ceil(task.data.length / this.chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            await this.processChunk(task, i);
        }

        this.tasks.shift();
        if (this.tasks.length > 0) {
            this.execute();
        }
    }

    // 处理单个块
    async processChunk(task, chunkIndex) {
        return new Promise(resolve => {
            requestIdleCallback(async (deadline) => {
                const startIndex = chunkIndex * this.chunkSize;
                const endIndex = Math.min(startIndex + this.chunkSize, task.data.length);
                const chunk = task.data.slice(startIndex, endIndex);

                const startTime = performance.now();
                
                // 在时间预算内处理
                while (chunk.length > 0 && deadline.timeRemaining() > 0) {
                    const item = chunk.shift();
                    await task.processor(item);
                }

                const duration = performance.now() - startTime;
                console.log(`Chunk ${chunkIndex + 1} processed in ${duration.toFixed(2)}ms`);
                
                resolve();
            });
        });
    }
}

// 使用示例
const splitter = new TaskSplitter();

// 处理大量数据
const largeDataset = Array.from({ length: 10000 }, (_, i) => i);

splitter.addTask(largeDataset, async (item) => {
    // 处理每个项目
    await processItem(item);
});

splitter.execute();
```

### 2. Web Workers 并行处理

将计算密集型任务转移到 Web Workers 中执行，避免阻塞主线程。

```javascript
// 主线程：创建和管理 Web Workers
class WorkerManager {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.initWorkers();
    }

    // 初始化 Workers
    initWorkers() {
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new Worker('/js/computation.worker.js');
            worker.id = i;
            worker.busy = false;
            
            worker.onmessage = (event) => {
                this.handleWorkerResponse(worker, event.data);
            };
            
            worker.onerror = (error) => {
                console.error(`Worker ${worker.id} error:`, error);
                this.handleWorkerError(worker, error);
            };
            
            this.workers.push(worker);
        }
    }

    // 分配任务
    assignTask(task) {
        const availableWorker = this.workers.find(w => !w.busy);
        
        if (availableWorker) {
            availableWorker.busy = true;
            availableWorker.postMessage({
                type: 'execute',
                task: task,
                id: task.id
            });
            
            return new Promise((resolve, reject) => {
                task.resolve = resolve;
                task.reject = reject;
            });
        } else {
            // 如果没有可用 Worker，加入队列
            this.taskQueue.push(task);
            return new Promise((resolve, reject) => {
                task.resolve = resolve;
                task.reject = reject;
            });
        }
    }

    // 处理 Worker 响应
    handleWorkerResponse(worker, data) {
        worker.busy = false;
        
        const task = this.findTaskById(data.id);
        if (task) {
            if (data.success) {
                task.resolve(data.result);
            } else {
                task.reject(data.error);
            }
        }
        
        // 处理队列中的下一个任务
        this.processNextTask();
    }
}

// Worker 脚本 (computation.worker.js)
self.onmessage = function(event) {
    const { type, task, id } = event.data;
    
    if (type === 'execute') {
        try {
            // 执行计算密集型任务
            const result = heavyComputation(task.data);
            
            self.postMessage({
                type: 'result',
                id: id,
                success: true,
                result: result
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                id: id,
                success: false,
                error: error.message
            });
        }
    }
};

function heavyComputation(data) {
    // 模拟计算密集型操作
    let result = 0;
    for (let i = 0; i < data.length; i++) {
        result += Math.sqrt(data[i]) * Math.sin(data[i]);
    }
    return result;
}
```

### 3. 时间切片（Time Slicing）

使用 `generator` 函数和 `setTimeout` 实现时间切片，将长任务分解为多个小任务。

```javascript
// 时间切片执行器
class TimeSlicingExecutor {
    constructor() {
        this.isRunning = false;
        this.currentGenerator = null;
    }

    // 执行生成器函数
    async executeGenerator(generatorFn, ...args) {
        if (this.isRunning) {
            throw new Error('Executor is already running');
        }

        this.isRunning = true;
        this.currentGenerator = generatorFn(...args);

        return new Promise((resolve, reject) => {
            this.runSlices(resolve, reject);
        });
    }

    // 运行时间切片
    runSlices(resolve, reject) {
        const startTime = performance.now();
        
        try {
            let result;
            let done = false;
            
            // 在时间预算内执行
            while (performance.now() - startTime < 16 && !done) {
                const next = this.currentGenerator.next();
                done = next.done;
                result = next.value;
            }
            
            if (done) {
                this.isRunning = false;
                resolve(result);
            } else {
                // 继续下一个时间片
                setTimeout(() => {
                    this.runSlices(resolve, reject);
                }, 0);
            }
        } catch (error) {
            this.isRunning = false;
            reject(error);
        }
    }
}

// 使用生成器函数处理大量数据
function* processLargeData(data) {
    const results = [];
    
    for (let i = 0; i < data.length; i++) {
        // 处理每个项目
        const processed = processItem(data[i]);
        results.push(processed);
        
        // 每处理 100 个项目 yield 一次
        if (i % 100 === 0) {
            yield;
        }
    }
    
    return results;
}

// 使用示例
const executor = new TimeSlicingExecutor();
const largeData = Array.from({ length: 10000 }, (_, i) => i);

executor.executeGenerator(processLargeData, largeData)
    .then(results => {
        console.log('Processing completed:', results.length);
    })
    .catch(error => {
        console.error('Processing failed:', error);
    });
```

### 4. 请求空闲期处理（Request Idle Callback）

利用浏览器的空闲时间执行非关键任务。

```javascript
// 空闲期任务调度器
class IdleTaskScheduler {
    constructor() {
        this.tasks = [];
        this.isProcessing = false;
    }

    // 添加任务
    addTask(task, priority = 'normal') {
        this.tasks.push({
            task,
            priority,
            added: Date.now()
        });
        
        // 按优先级排序
        this.tasks.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        this.scheduleProcessing();
    }

    // 调度处理
    scheduleProcessing() {
        if (this.isProcessing || this.tasks.length === 0) return;
        
        this.isProcessing = true;
        
        if ('requestIdleCallback' in window) {
            requestIdleCallback((deadline) => {
                this.processTasks(deadline);
            });
        } else {
            // 降级方案：使用 setTimeout
            setTimeout(() => {
                this.processTasks({ timeRemaining: () => 16 });
            }, 0);
        }
    }

    // 处理任务
    processTasks(deadline) {
        while (this.tasks.length > 0 && deadline.timeRemaining() > 0) {
            const taskObj = this.tasks.shift();
            
            try {
                taskObj.task();
            } catch (error) {
                console.error('Task execution failed:', error);
            }
        }
        
        if (this.tasks.length > 0) {
            // 还有任务需要处理，继续调度
            this.scheduleProcessing();
        } else {
            this.isProcessing = false;
        }
    }
}

// 使用示例
const scheduler = new IdleTaskScheduler();

// 添加高优先级任务
scheduler.addTask(() => {
    // 关键但非阻塞的任务
    updateAnalytics();
}, 'high');

// 添加低优先级任务
scheduler.addTask(() => {
    // 可以延迟执行的任务
    prefetchNextPage();
}, 'low');
```

## 高级优化技术

### 5. 渐进式加载（Progressive Loading）

```javascript
// 渐进式数据加载
class ProgressiveLoader {
    constructor() {
        this.visibleItems = new Set();
        this.observer = null;
    }

    // 初始化 Intersection Observer
    initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadItem(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px', // 提前 50px 加载
            threshold: 0.1
        });
    }

    // 加载可见项
    loadItem(element) {
        if (this.visibleItems.has(element)) return;
        
        this.visibleItems.add(element);
        
        // 执行加载逻辑
        this.executeLoad(element);
    }

    // 执行加载（可重写）
    executeLoad(element) {
        // 默认实现：加载图片或内容
        const img = element.querySelector('img[data-src]');
        if (img) {
            const src = img.getAttribute('data-src');
            img.src = src;
            img.removeAttribute('data-src');
        }
    }
}
```

### 6. 内存优化与垃圾回收

```javascript
// 内存监控器
class MemoryMonitor {
    constructor() {
        this.usage = [];
        this.threshold = 0.8; // 80% 内存使用阈值
    }

    // 开始监控
    startMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
        }, 5000); // 每 5 秒检查一次
    }

    // 检查内存使用
    async checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
            
            this.usage.push({
                timestamp: Date.now(),
                usage: usage,
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize
            });
            
            if (usage > this.threshold) {
                this.triggerCleanup();
            }
        }
    }

    // 触发清理
    triggerCleanup() {
        console.warn('High memory usage detected, triggering cleanup');
        
        // 清理不必要的缓存
        this.cleanupCaches();
        
        // 建议手动触发垃圾回收（开发环境）
        if (window.gc) {
            window.gc();
        }
    }
}
```

## 性能监控与报警

### 实时性能仪表板

```javascript
// 性能仪表板
class PerformanceDashboard {
    constructor() {
        this.metrics = {
            longTasks: [],
            memoryUsage: [],
            frameRate: []
        };
        
        this.init();
    }

    init() {
        this.setupLongTaskMonitoring();
        this.setupMemoryMonitoring();
        this.setupFrameRateMonitoring();
        this.setupAlerts();
    }

    // 设置长任务监控
    setupLongTaskMonitoring() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.metrics.longTasks.push({
                    duration: entry.duration,
                    timestamp: entry.startTime
                });
                
                this.checkLongTaskThreshold(entry);
            });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
    }

    // 检查长任务阈值
    checkLongTaskThreshold(entry) {
        if (entry.duration > 100) { // 超过 100ms 发出警告
            this.triggerAlert('long_task', {
                duration: entry.duration,
                threshold: 100
            });
        }
    }

    // 触发警报
    triggerAlert(type, data) {
        const alert = {
            type: type,
            data: data,
            timestamp: Date.now(),
            severity: this.calculateSeverity(data)
        };
        
        // 发送到监控系统
        this.sendAlert(alert);
        
        // 在控制台显示
        console.warn(`Performance Alert [${type}]:`, data);
    }
}
```

## 最佳实践总结

1. **监控先行**：在生产环境中部署长任务监控
2. **预防为主**：在开发阶段识别潜在的长任务
3. **渐进优化**：优先优化对用户体验影响最大的任务
4. **工具辅助**：使用 Chrome DevTools 的 Performance 面板进行分析
5. **持续改进**：定期审查和优化性能关键路径

通过实施这些优化策略，可以显著减少长任务对用户体验的影响，提升 Core Web Vitals 指标，为用户提供更流畅的交互体验。