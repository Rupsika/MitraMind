process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-123";
process.env.AI_SERVICE_URL = "http://ai.test";
delete process.env.REDIS_URL;
