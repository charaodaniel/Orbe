"use strict";

const http = require("node:http");

const host = "127.0.0.1";
const port = Number(process.env.PORT) || 4317;

const server = http.createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Cache-Control", "no-store");

  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "orbe-linux-agent" }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, host, () => {
  process.stdout.write(
    `Orbe Linux agent listening on http://${host}:${port}\n`,
  );
});
