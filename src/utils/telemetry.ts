/**
 * Telemetry and Observability Module
 * Captures metrics, errors, performance traces, and conversion logs.
 */

export interface TelemetryEvent {
  eventName: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface TelemetryError {
  message: string;
  stack?: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private errors: TelemetryError[] = [];
  private readonly maxLogs = 100;

  /**
   * Log an operational event
   */
  logEvent(eventName: string, data?: Record<string, any>) {
    const event: TelemetryEvent = {
      eventName,
      timestamp: Date.now(),
      data,
    };

    this.events.push(event);
    if (this.events.length > this.maxLogs) {
      this.events.shift();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Telemetry Event] ${eventName}`, data || '');
    }
  }

  /**
   * Capture and record an exception
   */
  captureException(error: Error | string, source = 'client', metadata?: Record<string, any>) {
    const errorObj: TelemetryError = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      source,
      timestamp: Date.now(),
      metadata,
    };

    this.errors.push(errorObj);
    if (this.errors.length > this.maxLogs) {
      this.errors.shift();
    }

    console.error(`[Telemetry Error] [${source}]`, errorObj.message, metadata || '');
  }

  /**
   * Measure performance duration of an async action
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.logEvent(`${name}_success`, { ...metadata, durationMs });
      return result;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      this.captureException(err, name, { ...metadata, durationMs });
      throw err;
    }
  }

  /**
   * Retrieve recent error logs for diagnostic export
   */
  getRecentErrors(): TelemetryError[] {
    return [...this.errors];
  }

  /**
   * Retrieve recent event logs
   */
  getRecentEvents(): TelemetryEvent[] {
    return [...this.events];
  }
}

export const telemetry = new TelemetryService();
