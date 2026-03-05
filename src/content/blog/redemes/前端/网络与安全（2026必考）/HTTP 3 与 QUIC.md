---
title: "HTTP 3 与 QUIC"
publishDate: 2025-04-08 09:15:30
tags: 
  - 网络与安全
language: '中文'
---

## 一、QUIC 协议核心特性

### 1. QUIC 连接建立
```javascript
// QUIC 连接建立模拟
class QUICConnection {
    constructor() {
        this.connectionId = this.generateConnectionId();
        this.version = 'QUIC-v1';
        this.streams = new Map();
        this.cryptoHandshake = new QUICCryptoHandshake();
        this.state = 'idle';
    }

    // 生成连接ID
    generateConnectionId() {
        const buffer = new Uint8Array(8);
        crypto.getRandomValues(buffer);
        return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 发起 QUIC 连接
    async connect(serverAddress) {
        this.state = 'connecting';
        
        // 发送初始包（包含 TLS 1.3 握手）
        const initialPacket = this.createInitialPacket();
        
        // 模拟发送过程
        const response = await this.sendPacket(initialPacket, serverAddress);
        
        if (response.type === 'handshake') {
            this.state = 'handshake';
            await this.processHandshake(response);
        }
        
        this.state = 'established';
        return this.connectionId;
    }

    // 创建初始包
    createInitialPacket() {
        return {
            type: 'initial',
            version: this.version,
            connectionId: this.connectionId,
            packetNumber: 0,
            payload: this.cryptoHandshake.getClientHello()
        };
    }

    // 处理握手过程
    async processHandshake(handshakePacket) {
        const serverHello = this.cryptoHandshake.processServerHello(handshakePacket.payload);
        
        // 验证服务器证书
        const certValid = await this.cryptoHandshake.verifyCertificate(serverHello.certificate);
        
        if (certValid) {
            // 完成密钥交换
            await this.cryptoHandshake.completeHandshake();
        } else {
            throw new Error('证书验证失败');
        }
    }

    // 发送数据包（模拟）
    async sendPacket(packet, address) {
        // 模拟网络延迟
        await this.delay(Math.random() * 50 + 10);
        
        // 模拟服务器响应
        return {
            type: 'handshake',
            connectionId: packet.connectionId,
            payload: 'server_hello_data'
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// QUIC 加密握手
class QUICCryptoHandshake {
    constructor() {
        this.clientRandom = crypto.getRandomValues(new Uint8Array(32));
        this.serverRandom = null;
        this.preSharedKey = null;
    }

    getClientHello() {
        return {
            version: 'TLS 1.3',
            cipherSuites: ['TLS_AES_128_GCM_SHA256'],
            supportedGroups: ['x25519'],
            keyShare: this.generateKeyShare(),
            preSharedKey: this.preSharedKey
        };
    }

    processServerHello(serverHelloData) {
        this.serverRandom = serverHelloData.random;
        return serverHelloData;
    }

    async verifyCertificate(certificate) {
        // 简化证书验证
        return true;
    }

    async completeHandshake() {
        // 生成会话密钥
        this.sessionKey = await this.generateSessionKey();
    }

    generateKeyShare() {
        // 生成椭圆曲线密钥对
        return {
            group: 'x25519',
            publicKey: 'client_public_key'
        };
    }

    async generateSessionKey() {
        // 生成会话密钥
        return 'session_key';
    }
}
```

### 2. QUIC 流管理
```javascript
// QUIC 流管理器
class QUICStreamManager {
    constructor(connection) {
        this.connection = connection;
        this.streams = new Map();
        this.nextStreamId = 0;
        this.maxConcurrentStreams = 100;
    }

    // 创建新流
    createStream(type = 'bidirectional') {
        const streamId = this.generateStreamId(type);
        const stream = new QUICStream(streamId, type, this.connection);
        
        this.streams.set(streamId, stream);
        return stream;
    }

    // 生成流ID
    generateStreamId(type) {
        let id;
        
        switch (type) {
            case 'client_bidirectional':
                id = this.nextStreamId * 4;
                break;
            case 'server_bidirectional':
                id = this.nextStreamId * 4 + 1;
                break;
            case 'client_unidirectional':
                id = this.nextStreamId * 4 + 2;
                break;
            case 'server_unidirectional':
                id = this.nextStreamId * 4 + 3;
                break;
        }
        
        this.nextStreamId++;
        return id;
    }

    // 处理传入流
    handleIncomingStream(streamId, data) {
        let stream = this.streams.get(streamId);
        
        if (!stream) {
            // 服务器发起的流
            const type = this.determineStreamType(streamId);
            stream = this.createStream(type);
        }
        
        stream.handleData(data);
    }

    determineStreamType(streamId) {
        if (streamId % 2 === 0) {
            return streamId % 4 === 0 ? 'client_bidirectional' : 'client_unidirectional';
        } else {
            return streamId % 4 === 1 ? 'server_bidirectional' : 'server_unidirectional';
        }
    }

    // 关闭流
    closeStream(streamId) {
        const stream = this.streams.get(streamId);
        if (stream) {
            stream.close();
            this.streams.delete(streamId);
        }
    }
}

// QUIC 流实现
class QUICStream {
    constructor(id, type, connection) {
        this.id = id;
        this.type = type;
        this.connection = connection;
        this.state = 'idle';
        this.buffer = [];
        this.offset = 0;
    }

    // 发送数据
    async sendData(data) {
        if (this.state === 'closed') {
            throw new Error('流已关闭');
        }

        this.state = 'open';
        
        // 分帧发送
        const frames = this.createDataFrames(data);
        
        for (const frame of frames) {
            await this.sendFrame(frame);
        }
    }

    // 创建数据帧
    createDataFrames(data) {
        const chunkSize = 1024; // 1KB 每帧
        const frames = [];
        
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            frames.push({
                type: 'data',
                streamId: this.id,
                offset: this.offset + i,
                data: chunk,
                fin: i + chunkSize >= data.length
            });
        }
        
        return frames;
    }

    // 发送帧
    async sendFrame(frame) {
        // 通过连接发送帧
        await this.connection.sendFrame(frame);
    }

    // 处理接收数据
    handleData(data) {
        this.buffer.push(data);
        
        // 触发数据可用事件
        if (this.onData) {
            this.onData(data);
        }
    }

    // 关闭流
    close() {
        this.state = 'closed';
        this.buffer = [];
        
        if (this.onClose) {
            this.onClose();
        }
    }
}
```

## 二、HTTP/3 协议实现

### 1. HTTP/3 帧格式
```javascript
// HTTP/3 帧处理器
class HTTP3FrameProcessor {
    constructor() {
        this.frameTypes = {
            DATA: 0x00,
            HEADERS: 0x01,
            CANCEL_PUSH: 0x03,
            SETTINGS: 0x04,
            PUSH_PROMISE: 0x05,
            GOAWAY: 0x07,
            MAX_PUSH_ID: 0x0D
        };
    }

    // 解析帧
    parseFrame(buffer) {
        const type = buffer.readUInt8(0);
        const length = buffer.readUIntBE(1, 3);
        const payload = buffer.slice(4, 4 + length);

        switch (type) {
            case this.frameTypes.DATA:
                return this.parseDataFrame(payload);
            case this.frameTypes.HEADERS:
                return this.parseHeadersFrame(payload);
            case this.frameTypes.SETTINGS:
                return this.parseSettingsFrame(payload);
            default:
                throw new Error(`未知帧类型: ${type}`);
        }
    }

    // 解析 DATA 帧
    parseDataFrame(payload) {
        return {
            type: 'DATA',
            streamId: payload.readUIntBE(0, 4),
            data: payload.slice(4)
        };
    }

    // 解析 HEADERS 帧
    parseHeadersFrame(payload) {
        const streamId = payload.readUIntBE(0, 4);
        const headerBlock = payload.slice(4);
        
        return {
            type: 'HEADERS',
            streamId,
            headers: this.parseQPACK(headerBlock)
        };
    }

    // 解析 QPACK 编码的头部
    parseQPACK(block) {
        // 简化 QPACK 解析
        const headers = {};
        let offset = 0;
        
        while (offset < block.length) {
            const nameLength = block.readUInt8(offset);
            offset++;
            
            const name = block.toString('utf8', offset, offset + nameLength);
            offset += nameLength;
            
            const valueLength = block.readUInt8(offset);
            offset++;
            
            const value = block.toString('utf8', offset, offset + valueLength);
            offset += valueLength;
            
            headers[name] = value;
        }
        
        return headers;
    }

    // 解析 SETTINGS 帧
    parseSettingsFrame(payload) {
        const settings = {};
        let offset = 0;
        
        while (offset < payload.length) {
            const identifier = payload.readUIntBE(offset, 2);
            offset += 2;
            
            const value = payload.readUIntBE(offset, 4);
            offset += 4;
            
            settings[identifier] = value;
        }
        
        return {
            type: 'SETTINGS',
            settings
        };
    }

    // 创建帧
    createFrame(type, data) {
        switch (type) {
            case 'HEADERS':
                return this.createHeadersFrame(data);
            case 'DATA':
                return this.createDataFrame(data);
            case 'SETTINGS':
                return this.createSettingsFrame(data);
            default:
                throw new Error(`不支持创建帧类型: ${type}`);
        }
    }

    // 创建 HEADERS 帧
    createHeadersFrame({ streamId, headers }) {
        const headerBlock = this.encodeQPACK(headers);
        const buffer = Buffer.alloc(4 + headerBlock.length);
        
        buffer.writeUIntBE(streamId, 0, 4);
        headerBlock.copy(buffer, 4);
        
        return this.wrapFrame(this.frameTypes.HEADERS, buffer);
    }

    // QPACK 编码
    encodeQPACK(headers) {
        const parts = [];
        
        for (const [name, value] of Object.entries(headers)) {
            const nameBuffer = Buffer.from(name, 'utf8');
            const valueBuffer = Buffer.from(value, 'utf8');
            
            parts.push(Buffer.from([nameBuffer.length]));
            parts.push(nameBuffer);
            parts.push(Buffer.from([valueBuffer.length]));
            parts.push(valueBuffer);
        }
        
        return Buffer.concat(parts);
    }

    // 包装帧
    wrapFrame(type, payload) {
        const length = payload.length;
        const header = Buffer.alloc(4);
        
        header.writeUInt8(type, 0);
        header.writeUIntBE(length, 1, 3);
        
        return Buffer.concat([header, payload]);
    }
}
```

### 2. HTTP/3 客户端实现
```javascript
// HTTP/3 客户端
class HTTP3Client {
    constructor() {
        this.quicConnection = null;
        this.controlStream = null;
        this.pushStream = null;
        this.requestStreams = new Map();
        this.frameProcessor = new HTTP3FrameProcessor();
    }

    // 连接到服务器
    async connect(serverUrl) {
        const url = new URL(serverUrl);
        
        // 建立 QUIC 连接
        this.quicConnection = new QUICConnection();
        await this.quicConnection.connect({
            host: url.hostname,
            port: url.port || 443
        });

        // 建立控制流
        this.controlStream = this.quicConnection.createStream('client_bidirectional');
        
        // 发送 SETTINGS 帧
        await this.sendSettings();
        
        // 监听服务器设置
        await this.receiveSettings();
        
        console.log('HTTP/3 连接已建立');
    }

    // 发送 SETTINGS 帧
    async sendSettings() {
        const settings = {
            MAX_HEADER_LIST_SIZE: 65536,
            QPACK_MAX_TABLE_CAPACITY: 0,
            QPACK_BLOCKED_STREAMS: 0
        };

        const frame = this.frameProcessor.createFrame('SETTINGS', { settings });
        await this.controlStream.sendData(frame);
    }

    // 接收服务器 SETTINGS
    async receiveSettings() {
        return new Promise((resolve) => {
            this.controlStream.onData = (data) => {
                const frame = this.frameProcessor.parseFrame(data);
                if (frame.type === 'SETTINGS') {
                    resolve(frame.settings);
                }
            };
        });
    }

    // 发送 HTTP/3 请求
    async request(method, path, headers = {}, body = null) {
        const stream = this.quicConnection.createStream('client_bidirectional');
        
        // 生成请求ID
        const requestId = Math.random().toString(36).substr(2, 9);
        this.requestStreams.set(requestId, stream);
        
        // 构建请求头
        const requestHeaders = {
            ':method': method,
            ':path': path,
            ':scheme': 'https',
            ':authority': new URL(this.quicConnection.serverAddress).hostname,
            ...headers
        };

        // 发送 HEADERS 帧
        const headersFrame = this.frameProcessor.createFrame('HEADERS', {
            streamId: stream.id,
            headers: requestHeaders
        });
        
        await stream.sendData(headersFrame);

        // 发送数据（如果有）
        if (body) {
            const dataFrame = this.frameProcessor.createFrame('DATA', {
                streamId: stream.id,
                data: body
            });
            
            await stream.sendData(dataFrame);
        }

        // 等待响应
        return this.waitForResponse(stream, requestId);
    }

    // 等待响应
    async waitForResponse(stream, requestId) {
        return new Promise((resolve, reject) => {
            let responseHeaders = null;
            let responseBody = [];

            stream.onData = (data) => {
                try {
                    const frame = this.frameProcessor.parseFrame(data);
                    
                    switch (frame.type) {
                        case 'HEADERS':
                            responseHeaders = frame.headers;
                            break;
                        case 'DATA':
                            responseBody.push(frame.data);
                            break;
                    }
                } catch (error) {
                    reject(error);
                }
            };

            stream.onClose = () => {
                if (responseHeaders) {
                    resolve({
                        headers: responseHeaders,
                        body: Buffer.concat(responseBody),
                        status: parseInt(responseHeaders[':status'])
                    });
                } else {
                    reject(new Error('未收到响应头'));
                }
                
                this.requestStreams.delete(requestId);
            };
        });
    }
}
```

## 三、性能优势与迁移策略

### 1. HTTP/3 性能对比
```javascript
// HTTP 协议性能对比测试
class HTTPProtocolBenchmark {
    constructor() {
        this.results = new Map();
    }

    // 测试连接建立时间
    async testConnectionTime(url, protocol) {
        const startTime = performance.now();
        
        switch (protocol) {
            case 'http1':
                await this.testHTTP1(url);
                break;
            case 'http2':
                await this.testHTTP2(url);
                break;
            case 'http3':
                await this.testHTTP3(url);
                break;
        }
        
        const endTime = performance.now();
        return endTime - startTime;
    }

    // 测试页面加载时间
    async testPageLoad(url, protocol) {
        const resources = await this.discoverResources(url);
        const startTime = performance.now();
        
        // 并发请求资源
        await Promise.all(
            resources.map(resource => this.fetchResource(resource, protocol))
        );
        
        const endTime = performance.now();
        return endTime - startTime;
    }

    // 发现页面资源
    async discoverResources(url) {
        // 模拟发现 CSS、JS、图片等资源
        return [
            `${url}/style.css`,
            `${url}/app.js`,
            `${url}/image1.jpg`,
            `${url}/image2.png`
        ];
    }

    // 获取资源
    async fetchResource(url, protocol) {
        // 模拟网络请求
        await this.delay(50 + Math.random() * 100);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 运行完整测试
    async runCompleteBenchmark(url) {
        const protocols = ['http1', 'http2', 'http3'];
        const results = {};
        
        for (const protocol of protocols) {
            console.log(`测试 ${protocol}...`);
            
            const connectionTime = await this.testConnectionTime(url, protocol);
            const pageLoadTime = await this.testPageLoad(url, protocol);
            
            results[protocol] = {
                connectionTime,
                pageLoadTime,
                improvement: this.calculateImprovement(protocol, connectionTime, pageLoadTime)
            };
        }
        
        return results;
    }

    calculateImprovement(protocol, connectionTime, pageLoadTime) {
        if (protocol === 'http1') {
            return { connection: '基准', pageLoad: '基准' };
        }
        
        // 计算相对于 HTTP/1.1 的改进
        const http1Results = this.results.get('http1');
        
        return {
            connection: `${((http1Results.connectionTime - connectionTime) / http1Results.connectionTime * 100).toFixed(1)}%`,
            pageLoad: `${((http1Results.pageLoadTime - pageLoadTime) / http1Results.pageLoadTime * 100).toFixed(1)}%`
        };
    }
}
```

HTTP/3 和 QUIC 协议代表了 Web 传输技术的未来发展方向，通过解决传统 TCP 的局限性，为现代 Web 应用提供了更好的性能和用户体验。