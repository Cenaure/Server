const redis = require('redis');

const redisClient = redis.createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379
  }
});

redisClient.on('error', (error) => console.error(`Error: ${error.message}`));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
};

const pingRedis = async () => {
  try {
    const pong = await redisClient.ping();
    console.log(`Redis Ping: ${pong}`);
  } catch (error) {
    console.error('Error pinging Redis:', error);
  }
};

process.on('SIGINT', async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis client disconnected');
    process.exit(0);
  }
});

module.exports = {
  redisClient,
  connectRedis,
  pingRedis
};
