const LOGS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_LOGS !== 'false';

export const logger = {
  log: (...args: any[]) => LOGS_ENABLED && console.log(...args),
  warn: (...args: any[]) => LOGS_ENABLED && console.warn(...args),
  error: (...args: any[]) => LOGS_ENABLED && console.error(...args),
  info: (...args: any[]) => LOGS_ENABLED && console.info(...args),
};
