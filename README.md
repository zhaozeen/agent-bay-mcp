# AgentBay MCP Server

基于Node.js/TypeScript的MCP（Model Context Protocol）代理服务器，连接到阿里云无影AgentBay服务，将SSE协议转换为MCP协议，为AI代理提供云基础设施工具。

## 功能特性

- 🔗 **协议转换**: 将SSE协议转换为MCP协议
- 🌍 **多区域支持**: 支持新加坡和中国区域
- 🔧 **工具代理**: 提供53个云基础设施工具
- 🚀 **多种部署**: 支持stdio和REST两种传输模式
- 🐳 **容器化**: 提供Docker支持
- 🔐 **安全认证**: 支持AgentBay API密钥认证

## 快速开始

### 环境要求

- Node.js 18+
- TypeScript 5.0+

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行服务器

#### 使用stdio模式（默认）

```bash
# 无API key模式（返回默认工具）
npm start

# 有API key模式（连接真实服务器）
AGENTBAY_API_KEY=your_api_key npm start
```

#### 使用REST模式

```bash
# 启动REST服务器
npm start -- --mode=rest --port=9593

# 测试API
curl -X POST http://localhost:9593/rest \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

## 配置参数

| 参数 | 环境变量 | 默认值 | 描述 |
|------|----------|--------|------|
| `--api_key` | `AGENTBAY_API_KEY` | - | AgentBay API密钥 |
| `--image_id` | `IMAGE_ID` | `windows_latest` | 默认镜像ID |
| `--region` | `REGION` | `singapore` | 区域选择（singapore/china） |
| `--mode` | `MODE` | `stdio` | 传输模式（stdio/rest） |
| `--port` | `PORT` | `9593` | REST服务器端口 |
| `--endpoint` | `ENDPOINT` | `/rest` | REST端点路径 |

## Docker部署

### 构建镜像

```bash
docker build -t agentbay/mcp .
```

### 运行容器

```bash
# stdio模式
docker run -i --rm -e AGENTBAY_API_KEY=your_key agentbay/mcp

# REST模式
docker run -p 9593:9593 -e AGENTBAY_API_KEY=your_key -e MODE=rest agentbay/mcp
```

## 工具列表

### 核心工具

- `get_resource`: 获取无影MCP运行时URL
- `system_screenshot`: 截取系统屏幕截图
- `release_resource`: 释放资源
- `browser_navigate`: 浏览器导航
- `shell`: 执行Shell命令

### 浏览器工具

- `browser_click`: 点击元素
- `browser_type`: 输入文本
- `browser_scroll`: 滚动页面

### 文件工具

- `file_read`: 读取文件
- `file_write`: 写入文件

## API密钥格式

AgentBay API密钥支持以下格式：
- `ako-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- `akm-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 区域配置

- **新加坡区域**: `https://agentbay-intl.wuying.aliyuncs.com`
- **中国区域**: `https://agentbay.wuying.aliyuncs.com`

## 开发

### 项目结构

```
agentbay-mcp/
├── src/
│   ├── index.ts              # 主服务器文件
│   ├── utils.ts              # 工具函数
│   └── default-tools.ts      # 默认工具列表
├── tests/
│   └── test-server.js        # 测试脚本
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
├── chatmcp.yaml              # mcp.so平台配置
├── Dockerfile                # 容器化配置
├── .dockerignore             # Docker忽略文件
├── .gitignore                # Git忽略文件
├── README.md                 # 项目文档
└── LICENSE                   # 许可证
```

### 测试

```bash
# 测试无API key情况
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npm start

# 测试有API key情况
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | AGENTBAY_API_KEY=your_key npm start
```

## 许可证

MIT License

## 作者

Michael98671 