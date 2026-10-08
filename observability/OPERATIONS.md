# Monitoring, Observability, and SRE

## Run the local stack

Set `GRAFANA_ADMIN_PASSWORD` in the root `.env` (use a different value from the development default), then start the application and observability profile:

```sh
docker compose --profile observability up --build -d postgres redis backend frontend prometheus grafana loki tempo alloy
```

Grafana is at `http://localhost:3000` (admin user defaults to `admin`); Prometheus is at `http://localhost:9090`. The app dashboard is provisioned automatically. In Grafana Explore, use Loki to search container logs and Tempo to inspect request traces. Prometheus alert rules are available from its Alerts page.

Grafana, Prometheus, and the direct API port bind to loopback. On EC2, connect to Grafana with an SSH tunnel, for example `ssh -L 3000:127.0.0.1:3000 ubuntu@<EC2-host>`, and open `http://localhost:3000` locally. Keep inbound security-group rules limited to the public website and SSH access you need.

Grafana Alloy collects Docker logs through the Docker socket. Access to that socket is effectively host-level access, so keep Alloy on a trusted host and do not expose its receiver or control ports publicly. Loki and Tempo use local filesystem storage suitable for a demo/single host; use managed or durable remote storage for production retention and disaster recovery.

## Three observability pillars

- **Metrics:** `GET /metrics` exposes request counts, request duration histogram, in-flight requests, process uptime, and resident memory in Prometheus text format. Prometheus scrapes it every 15 seconds. The `/metrics` host port is loopback-only.
- **Logs:** API access logs are structured JSON and include a trace ID, route template, status, and duration. Alloy tails Docker container logs and sends them to Loki. Request paths use Express route templates; query strings and request bodies are deliberately omitted.
- **Traces:** The API accepts or creates W3C `traceparent` IDs, returns the updated header, and emits one Zipkin-compatible server span per completed HTTP request to Alloy. Alloy batches spans and sends them to Tempo. This is request-level tracing for the current single API process; it does not yet create child spans for individual SQL calls or frontend work.

## Initial SLOs and indicators

Treat these as starter objectives and review them against real traffic after collecting a baseline:

| Service-level objective | Indicator | Initial target |
| --- | --- | --- |
| API availability over a rolling 30 days | Successful business API requests / all business API requests (exclude health checks) | 99.5% |
| API latency over a rolling 30 days | Business API requests completed within 500 ms | 95% |

At 99.5% availability, the 30-day error budget is 0.5% (about 3 hours 36 minutes). Use burn rate to prioritize reliability work: pause feature releases when the budget is exhausted or is burning rapidly. Current Prometheus rules provide starter alerts for a missing scrape target, a sustained server-error rate above 5%, and latency objective misses. They are visible in Prometheus; configure a Grafana contact point or Alertmanager receiver to deliver them to email/chat/on-call.

Useful PromQL starting points:

```promql
# Availability over 30 days, excluding health endpoints
1 - (
  sum(increase(canteen_http_requests_total{status_code=~"5..",route!~"/api/(health|ready|live)"}[30d]))
  /
  clamp_min(sum(increase(canteen_http_requests_total{route!~"/api/(health|ready|live)"}[30d])), 1)
)

# 30-day fraction of requests completed within 500 ms
sum(increase(canteen_http_request_duration_seconds_bucket{le="0.5",route!~"/api/(health|ready|live)"}[30d]))
/
clamp_min(sum(increase(canteen_http_request_duration_seconds_count{route!~"/api/(health|ready|live)"}[30d])), 1)
```

## Incident response

1. **Detect:** Use Prometheus alerts and the GitHub production health workflow. Configure Grafana notifications for actionable alerts.
2. **Triage:** Check the Canteen Service Overview dashboard, Prometheus target health, and Loki logs. Follow a trace ID from a JSON access log into Tempo.
3. **Mitigate:** Roll back to the previous working GHCR image tag by redeploying that commit, or restore the failed dependency. Avoid schema-destructive database changes during mitigation.
4. **Communicate:** Record incident start, impact, owner, current mitigation, and next update time in the team's incident channel.
5. **Resolve and review:** Verify health and SLO recovery, then write a blameless postmortem for customer-impacting or repeated incidents.

## Postmortem template

- **Summary and severity:**
- **Customer impact and duration:**
- **Detection source and timeline (UTC):**
- **Root/contributing causes:**
- **What went well / what made response harder:**
- **Corrective actions:** (owner, due date, priority)
- **SLO/error-budget impact:**
- **Follow-up review date:**
