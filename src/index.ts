import http from "node:http";
import * as redisClient from "./redis.js";

const writeEntry = async function (redisClient: redisClient.RedisClientType): Promise<string> {
  const timestamp = Date.now();
  const key = `docker-redis-app:${timestamp}`;
  console.info("Setting Redis key -", key);
  redisClient.set(key, `Set by Redis app on ${new Date(timestamp).toISOString()}`, { EX: 60 });
  return key;
};

const startHttpServer = async function (): Promise<undefined> {
  try {
    console.info("Server starting");
    const hostName = process.env.HTTP_HOST || "localhost";
    const httpPort = process.env.HTTP_PORT || "3000";
    const redisUrl = process.env.REDIS_URL || "redis://redis-stack:6379";

    const client: redisClient.RedisClientType = await redisClient.createRedisClient(redisUrl);

    const writeEntryListener = async function (req: http.IncomingMessage, res: http.ServerResponse) {
      console.info(`Handling request ${req.url}`);

      const key = await writeEntry(client);
      const keyStr = JSON.stringify({ key: key });

      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(keyStr, "utf-8");
    };

    const cleanup = function () {
      console.log("Server stopping");
      server.close();
      server.closeAllConnections();

      if (client) {
        const quit = client.quit();
        console.info("Redis client disconnected:", quit);
      }

      console.info("Server stopped");
      process.exit(0);
    };

    const server = http.createServer(writeEntryListener);

    server.listen(parseInt(httpPort), hostName, () => {
      console.log(`Node server is running on http://${hostName}:${httpPort}`);
      console.log(`RedisInsight UI is running on http://localhost:8001`);
      console.log(`Exec into app container --> docker exec -it node-redis sh`);
    });

    process.on("SIGTERM", cleanup);
  } catch (e) {
    console.error("App error", e);
    process.exit(1);
  }
};

startHttpServer();
