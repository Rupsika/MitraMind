import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

createApp().listen(env.PORT, () => logger.info("server_started", { port: env.PORT }));
