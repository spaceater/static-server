const express = require("express");
const http = require("http");
const { HOST, PORT, STATIC_PATH, TMP_PATH } = require("./config");
const corsMiddleware = require("./src/middleware/cors");
const { registerRoutes } = require("./src/router");

// 创建Express应用
const app = express();

// 创建HTTP服务器
const server = http.createServer(app);

// 注册中间件
app.use(corsMiddleware);

// 设置为静态资源
app.use(express.static(STATIC_PATH));

// 注册路由
registerRoutes(app);

// 开启服务器实例
server.listen(PORT, HOST, () => {
    console.log(`Static server is running at http://${HOST}:${PORT}`);
    console.log(`Serving static files from: ${STATIC_PATH}`);
    console.log(`Temporary files are stored in: ${TMP_PATH}`);
});
