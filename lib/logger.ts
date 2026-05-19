type LoggerMethod = "debug" | "info" | "warn" | "error";

type Logger = Record<LoggerMethod, (...messages: readonly unknown[]) => void>;

const isProduction = process.env.NODE_ENV === "production";

const createLoggerMethod =
  (method: LoggerMethod) =>
  (...messages: readonly unknown[]): void => {
    if (isProduction) {
      return;
    }

    console[method](...messages);
  };

export const logger: Logger = {
  debug: createLoggerMethod("debug"),
  info: createLoggerMethod("info"),
  warn: createLoggerMethod("warn"),
  error: createLoggerMethod("error"),
};

export const server: Logger = {
  debug: (...messages) => console.debug(...messages),
  info: (...messages) => console.info(...messages),
  warn: (...messages) => console.warn(...messages),
  error: (...messages) => console.error(...messages),
};
