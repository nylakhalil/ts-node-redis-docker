import { RedisClientOptions, createClient } from "redis";

export type RedisClientType = ReturnType<typeof createClient>;

/**
 * Checks Redis connection isOpen and isReady. Pings Redis server.
 *
 * @param redisClient - The RedisClientType to test
 * @returns Whether connection is active
 */
export const isConnected = async function (redisClient: RedisClientType): Promise<boolean> {
  console.debug("Pinging Redis server");

  if (!redisClient.isOpen || !redisClient.isReady) {
    console.warn(`Redis server not ready`);
    return false;
  }

  const status = await redisClient.ping();
  console.info(`Redis connection ping response --> ${status}`);
  return status === "PONG";
};

/**
 * Creates a Redis client connection using node-redis package
 *
 * @param redisUrl - A URL string to connect to Redis server
 * @returns Redis client connection
 * @throws	Error
 */
export const createRedisClient = async function (redisUrl: string): Promise<RedisClientType> {
  console.info("Creating Redis client");
  const clientOptions: RedisClientOptions = {
    url: redisUrl,
  };

  const redisClient = createClient(clientOptions);
  await redisClient.connect();

  redisClient.on("end", () => {
    console.info("Redis connection ended");
  });

  const connected = await isConnected(redisClient);
  if (!connected) {
    throw new Error("Redis connection failure");
  }

  return redisClient;
};
