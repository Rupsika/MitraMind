/** Structured JSON logger. Callers must never pass message content, passwords, or tokens. */
type Fields = Record<string, unknown>;

function write(level: string, msg: string, fields: Fields = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(JSON.stringify({ level, time: new Date().toISOString(), msg, ...fields }));
}

export const logger = {
  info: (msg: string, fields?: Fields) => write("info", msg, fields),
  warn: (msg: string, fields?: Fields) => write("warn", msg, fields),
  error: (msg: string, fields?: Fields) => write("error", msg, fields),
};
