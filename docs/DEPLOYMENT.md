# 前后端部署

本文提供通用部署结构，不包含线上服务器的账号、IP、证书或数据库。请先完成 README 中的依赖安装与构建。

## 运行结构

- Nginx 等反向代理对外提供 HTTPS，将静态文件根目录指向本项目 `dist/`。
- `/api/` 转发至仅监听本机的 Node 服务，生产环境默认 `127.0.0.1:3100`。
- 其余页面路由回退到 `index.html`，以支持 Vue Router 的深层链接。
- Node 的工作目录必须是项目根目录，数据库迁移依赖 `schema/`。

服务端启动示例（替换为自己的域名）：

```sh
SITE_ORIGIN=https://example.com SITE_SECURE_COOKIE=true npm run server -- --env prod
```

首次配置管理员：

```sh
npm run admin -- --env prod
```

生产服务应由 systemd 或其他进程管理器持续运行，并设置相同的工作目录和环境变量。`.env.local` 不会被 Node 服务端自动加载。

## Nginx 路由片段

下面只展示已有 HTTPS `server` 块内的路由部分，证书申请与域名解析由部署环境配置：

```nginx
root /path/to/liangyanghao-ai-site/dist;
index index.html;

location /api/ {
    proxy_pass http://127.0.0.1:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

`SITE_ORIGIN` 应与实际访问后台的 HTTPS 域名一致，否则写操作会被源站校验拒绝。需要使用后台媒体上传时，按业务需要设置代理上传大小、超时，并给 Node 配置有效的 `FFPROBE_PATH`。

## 数据与更新

生产数据在 `.local/prod/`，包括 SQLite 数据库、媒体文件和随机密钥。应保留该目录并单独备份；不要把它上传到 GitHub，也不要用干净源码副本覆盖已有数据。更新源码、安装依赖和替换 `dist/` 时同样保留运行环境的配置。

SQLite 备份应在服务停止时进行，或使用支持 SQLite 一致性的备份方式。服务启动会自动执行尚未应用的数据库迁移。

仅需课程与文章展示时，可采用 README 的静态部署方式，不运行后台。
