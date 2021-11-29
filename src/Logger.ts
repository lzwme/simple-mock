/* eslint no-console: 0 */
import { color } from 'console-log-colors';

/** 日志级别 */
export enum LogLevel {
  error,
  silent,
  warning,
  info,
  log,
  debug,
}

export type LogLevelType = keyof typeof LogLevel;

const LogLevelHeadTip = {
  error: color.redBright('[ERROR]'),
  warn: color.yellowBright('[WARNING]'),
  info: color.blueBright('[INFO]'),
  log: color.whiteBright('[LOG]'),
  debug: color.gray('[DEBUG]'),
} as const;

export class Logger {
  public static map: { [tag: string]: Logger } = {};
  /** 日志记录级别 */
  private level: LogLevel;
  private logTimes = 0;
  /** 是否打印当前时间 */
  public showTime = true;

  public error: (...args) => void;
  public warn: (...args) => void;
  public info: (...args) => void;
  public log: (...args) => void;
  public debug: (...args) => void;

  constructor(private tag: string, levelType: LogLevelType, showTime = true) {
    const match = /(\w+)/.exec(tag);
    if (!match) throw new Error('Logger tag expected');

    this.tag = tag;
    this.showTime = showTime;

    if (process.env.FLH_LOG_LEVEL) levelType = process.env.FLH_LOG_LEVEL as LogLevelType;

    this.setLevel(levelType);
    this.error = this._log.bind(this, 'error');
    this.warn = this._log.bind(this, 'warn');
    this.info = this._log.bind(this, 'info');
    this.log = this._log.bind(this, 'log');
    this.debug = this._log.bind(this, 'debug');
  }

  private _log(type: LogLevelType, ...args) {
    const lvl = LogLevel[type];

    if (lvl <= this.level) {
      let header = color.cyanBright(`${this.tag}`);

      if (this.showTime) header = `[${new Date().toTimeString().slice(0, 8)}]` + header;

      if (lvl === LogLevel.debug) header += `[${this.logTimes}]`;

      if (LogLevelHeadTip[type]) header = LogLevelHeadTip[type] + header;

      switch (lvl) {
        case LogLevel.error:
          console.error(header, ...args);
          break;
        case LogLevel.warning:
          console.warn(header, ...args);
          break;
        case LogLevel.info:
          console.info(header, ...args);
          break;
        case LogLevel.log:
          console.log(header, ...args);
          break;
        case LogLevel.debug:
          console.debug(header, ...args);
          break;
      }
    }

    this.logTimes++;
    // todo: 增加写入日志文件的能力
  }
  public setLevel(levelType: LogLevelType) {
    if (LogLevel[levelType] != null) this.level = LogLevel[levelType];
  }

  public static getLogger(tag = '[general]', levelType: LogLevelType = 'log', showTime = true): Logger {
    if (!Logger.map[tag]) Logger.map[tag] = new Logger(tag, levelType, showTime);
    return Logger.map[tag];
  }
}
