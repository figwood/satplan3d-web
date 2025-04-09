# 构建阶段
FROM node:18-slim AS builder

WORKDIR /app

# 添加构建依赖
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装构建依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:23.3.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# 只复制必要的文件
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 添加非 root 用户
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]