// Vercel serverless entrypoint. Local/Docker runs keep using src/server.ts.
import { createApp } from "../src/app";

export default createApp();
