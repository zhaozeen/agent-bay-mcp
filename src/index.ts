#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RestServerTransport } from "@chatmcp/sdk/server/rest.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getParamValue, getAuthValue, validateApiKey, formatError } from "./utils.js";
import { defaultTools } from "./default-tools.js";

// 配置schema
export const configSchema = z.object({
  AGENTBAY_API_KEY: z.string().optional().default("").describe("AgentBay API key for authentication"),
  IMAGE_ID: z.string().default("windows_latest").describe("Default image ID for environments"),
  REGION: z.enum(["singapore", "china"]).optional().default("singapore").describe("Region: singapore or china"),
  MODE: z.enum(["stdio", "rest"]).optional().default("stdio").describe("Transport mode"),
  PORT: z.string().default("9593").describe("REST server port"),
  ENDPOINT: z.string().default("/rest").describe("REST endpoint path"),
});

// 获取配置参数
const config = {
  AGENTBAY_API_KEY: getParamValue("api_key") || getParamValue("AGENTBAY_API_KEY") || "",
  IMAGE_ID: getParamValue("image_id") || getParamValue("IMAGE_ID") || "windows_latest",
  REGION: (getParamValue("region") || getParamValue("REGION") || "singapore") as "singapore" | "china",
  MODE: (getParamValue("mode") || getParamValue("MODE") || "stdio") as "stdio" | "rest",
  PORT: getParamValue("port") || getParamValue("PORT") || "9593",
  ENDPOINT: getParamValue("endpoint") || getParamValue("ENDPOINT") || "/rest",
};

// 创建服务器实例
const server = new McpServer({
  name: "agentbay-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// 连接状态和工具缓存
let connected = false;
let targetTools: any[] = [];
let client: Client;

// 连接到目标服务器并获取工具
const connectToTarget = async () => {
  if (!config.AGENTBAY_API_KEY) {
    throw new Error("API key is required for tool execution");
  }
  
  try {
    // 根据区域选择基础URL
    const baseUrl = config.REGION === "singapore" 
      ? "https://agentbay-intl.wuying.aliyuncs.com"
      : "https://agentbay.wuying.aliyuncs.com";
    const targetUrl = `${baseUrl}/sse?APIKEY=${config.AGENTBAY_API_KEY}&IMAGEID=${config.IMAGE_ID}`;
    
    const transport = new SSEClientTransport(new URL(targetUrl));
    client = new Client({
      name: "agentbay-mcp-client",
      version: "1.0.0",
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    const toolsResult = await client.listTools();
    targetTools = toolsResult.tools || [];
    connected = true;
    
  } catch (error) {
    console.error("Failed to connect to target server:", error);
    connected = false;
    throw error;
  }
};

// 处理工具列表请求 - 如果没有API key返回静态工具，否则返回真实工具
server.server.setRequestHandler(ListToolsRequestSchema, async () => {
  if (!config.AGENTBAY_API_KEY) {
    return {
      tools: defaultTools
    };
  }
  
  if (!connected) {
    await connectToTarget();
  }
  
  return {
    tools: targetTools
  };
});

// 处理工具调用 - 验证API key并连接到目标服务器
server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!connected) {
    await connectToTarget();
  }

  try {
    const result = await client.callTool(request.params);
    return result;
  } catch (error) {
    throw new Error(`Tool call failed: ${error}`);
  }
});

// 启动服务器
async function runServer() {
  try {
    if (config.MODE === "rest") {
      const transport = new RestServerTransport({
        port: parseInt(config.PORT),
        endpoint: config.ENDPOINT,
      });
      await server.connect(transport);
      await transport.startServer();
      console.error(`AgentBay MCP Server running on REST mode at http://localhost:${config.PORT}${config.ENDPOINT}`);
      return;
    }

    // 默认使用 stdio 传输
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("AgentBay MCP Server running on stdio with cloud infrastructure tools");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer();
