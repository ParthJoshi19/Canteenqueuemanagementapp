import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const buckets = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
type Series = { method: string; route: string; status: string; count: number; sum: number; bucketCounts: number[] };
const requests = new Map<string, Series>();
const inFlight = new Map<string, number>();

function labels(method: string, route: string, status = ''): string {
  const parts = [`method="${method}"`, `route=${JSON.stringify(route)}`];
  if (status) parts.push(`status_code="${status}"`);
  return `{${parts.join(',')}}`;
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

function routeName(req: Request): string {
  if (!req.route?.path) return 'unmatched';
  return `${req.baseUrl}${String(req.route.path)}` || '/';
}

export function httpTelemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method;
  const current = inFlight.get(method) ?? 0;
  inFlight.set(method, current + 1);

  const startedAt = Date.now();
  const incomingTraceparent = req.header('traceparent');
  const match = incomingTraceparent?.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i);
  const traceId = match?.[1] ?? randomHex(16);
  const parentId = match?.[2];
  const spanId = randomHex(8);
  res.setHeader('traceparent', `00-${traceId}-${spanId}-${match?.[3] ?? '01'}`);

  res.once('finish', () => {
    const durationSeconds = (Date.now() - startedAt) / 1000;
    const route = routeName(req);
    const status = String(res.statusCode);
    const key = JSON.stringify([method, route, status]);
    const series = requests.get(key) ?? {
      method,
      route,
      status,
      count: 0,
      sum: 0,
      bucketCounts: buckets.map(() => 0),
    };
    series.count += 1;
    series.sum += durationSeconds;
    buckets.forEach((bound, index) => {
      if (durationSeconds <= bound) series.bucketCounts[index] += 1;
    });
    requests.set(key, series);
    inFlight.set(method, Math.max(0, (inFlight.get(method) ?? 1) - 1));

    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      timestamp,
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      message: 'http_request_complete',
      trace_id: traceId,
      span_id: spanId,
      method,
      route,
      status_code: res.statusCode,
      duration_ms: Math.round(durationSeconds * 1000),
    }));

    const endpoint = process.env.TRACE_EXPORT_URL;
    if (endpoint) {
      const span = {
        traceId,
        id: spanId,
        ...(parentId ? { parentId } : {}),
        name: `${method} ${route}`.toLowerCase(),
        kind: 'SERVER',
        timestamp: startedAt * 1000,
        duration: Math.max(1, Math.round(durationSeconds * 1_000_000)),
        localEndpoint: { serviceName: process.env.OTEL_SERVICE_NAME ?? 'canteen-backend' },
        tags: {
          'http.method': method,
          'http.route': route,
          'http.status_code': String(res.statusCode),
          'http.url': route,
          ...(res.statusCode >= 500 ? { error: 'true' } : {}),
        },
      };
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([span]),
        signal: AbortSignal.timeout(1500),
      }).catch(() => undefined);
    }
  });

  next();
}

export function renderPrometheusMetrics(): string {
  const lines = [
    '# HELP canteen_http_requests_total Completed HTTP requests.',
    '# TYPE canteen_http_requests_total counter',
  ];
  for (const series of requests.values()) {
    lines.push(`canteen_http_requests_total${labels(series.method, series.route, series.status)} ${series.count}`);
  }

  lines.push(
    '# HELP canteen_http_request_duration_seconds HTTP request duration in seconds.',
    '# TYPE canteen_http_request_duration_seconds histogram',
  );
  for (const series of requests.values()) {
    buckets.forEach((bound, index) => {
      lines.push(`canteen_http_request_duration_seconds_bucket${labels(series.method, series.route, series.status).slice(0, -1)},le="${bound}"} ${series.bucketCounts[index]}`);
    });
    lines.push(`canteen_http_request_duration_seconds_bucket${labels(series.method, series.route, series.status).slice(0, -1)},le="+Inf"} ${series.count}`);
    lines.push(`canteen_http_request_duration_seconds_sum${labels(series.method, series.route, series.status)} ${series.sum}`);
    lines.push(`canteen_http_request_duration_seconds_count${labels(series.method, series.route, series.status)} ${series.count}`);
  }

  lines.push(
    '# HELP canteen_http_requests_in_flight Current HTTP requests in flight.',
    '# TYPE canteen_http_requests_in_flight gauge',
  );
  for (const [method, count] of inFlight) lines.push(`canteen_http_requests_in_flight{method="${method}"} ${count}`);
  lines.push(
    '# HELP process_uptime_seconds Process uptime in seconds.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime()}`,
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${process.memoryUsage().rss}`,
    '',
  );
  return lines.join('\n');
}
