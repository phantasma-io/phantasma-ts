export interface Logger {
  log?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
  trace?: (...args: unknown[]) => void;
}

const noop = () => {};

// Default SDK logger: silent unless the consumer explicitly enables logging.
export const logger: Required<Logger> = {
  log: noop,
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  trace: noop,
};

// Use a custom logger (for example, setLogger(console)) to enable output.
export function setLogger(custom?: Logger): void {
  logger.log = custom?.log ?? noop;
  logger.info = custom?.info ?? noop;
  logger.warn = custom?.warn ?? noop;
  logger.error = custom?.error ?? noop;
  logger.debug = custom?.debug ?? noop;
  logger.trace = custom?.trace ?? custom?.debug ?? custom?.log ?? noop;
}
