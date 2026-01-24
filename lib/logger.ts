type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

const LOGS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_LOGS !== 'false';
const DEFAULT_LEVEL: LogLevel = 'info';

const isValidLevel = (level?: string): level is LogLevel =>
  level === 'debug' || level === 'info' || level === 'warn' || level === 'error' || level === 'silent';

const rawLevel = process.env.EXPO_PUBLIC_LOG_LEVEL?.toLowerCase();
const configuredLevel = isValidLevel(rawLevel) ? rawLevel : DEFAULT_LEVEL;
const effectiveLevel: LogLevel = LOGS_ENABLED ? configuredLevel : 'silent';

const shouldLog = (level: LogLevel) => LOG_LEVELS[level] >= LOG_LEVELS[effectiveLevel];

const logWith = (level: LogLevel, method: 'log' | 'info' | 'warn' | 'error') =>
  (...args: unknown[]) => {
    if (shouldLog(level)) {
      console[method](...args);
    }
  };

export const logger = {
  debug: logWith('debug', 'log'),
  info: logWith('info', 'info'),
  warn: logWith('warn', 'warn'),
  error: logWith('error', 'error'),
  isDebugEnabled: () => shouldLog('debug'),
};
