# 多阶段构建
FROM node:22.12-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN --mount=type=cache,target=/root/.npm npm ci

# 复制源代码
COPY src/ ./src/

# 构建项目
RUN npm run build

# 生产阶段
FROM node:22.12-alpine AS release

# 设置工作目录
WORKDIR /app

# 复制构建产物和package文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 设置生产环境
ENV NODE_ENV=production

# 安装生产依赖
RUN npm ci --ignore-scripts --omit=dev

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agentbay -u 1001

# 切换到非root用户
USER agentbay

# 暴露端口（用于REST模式）
EXPOSE 9593

# 设置入口点
ENTRYPOINT ["node", "dist/index.js"] 