# GitHub Actions CI/CD

## Workflows

- **CI** runs backend unit tests and TypeScript compilation, plus the frontend production build, on pull requests and pushes to `main` or `master`.
- **Deploy to EC2** pulls the latest code on the host over SSH and builds/restarts the application containers using Docker Compose on pushes to `main`. Run it manually from the Actions page when needed.
- **Production health monitor** checks `/api/health` every 10 minutes and on demand. A failed check fails the workflow and is visible in GitHub Actions; configure GitHub notifications for workflow failures to receive alerts.
- **Monitoring and SRE**: see [`observability/OPERATIONS.md`](observability/OPERATIONS.md) for Grafana, Prometheus, Loki, Tempo, SLOs, incident response, and postmortems.

## One-time setup

1. Add a GitHub Actions environment named `production`.
2. Add these secrets to the **production** environment (the deploy job uses that environment):
   - `DEPLOY_HOST`: SSH host for the Docker Compose machine.
   - `DEPLOY_USER`: SSH account that can run Docker Compose.
   - `DEPLOY_SSH_KEY`: private SSH key for that account.
   - `DEPLOY_PATH`: directory on the host containing this repository's `docker-compose.yml` and supporting files.
   - `DB_PASSWORD`: PostgreSQL password used by the Compose services.
   - `JWT_SECRET`: long, random signing secret.
   - `GRAFANA_ADMIN_PASSWORD`: strong password for the Grafana administrator.
3. Ensure the host has Docker Engine and the Compose plugin, and that the deploy account can access the repository directory and Docker daemon.
4. Add the repository variable `MONITOR_URL` with the public base URL of the deployed app, for example `https://canteen.example.edu` (no `/api/health` suffix).

The production deployment expects `DEPLOY_PATH` to point to a clean Git checkout with an `origin` remote and a `main` branch. It fetches the latest `main` before using the Compose file, starts PostgreSQL, waits for readiness, runs backend migrations, restarts the API and frontend, starts the observability profile, and checks the public HTTP page. It fails if the checkout has local changes. For an existing PostgreSQL volume, `DB_PASSWORD` must match the password already stored in that database. The current Compose file also contains demo services and development defaults; review those settings before exposing a deployment to the public internet.

## Tests

The backend test command covers representative Lamport clock, vector clock, and mutual-exclusion behavior. The repository did not have an existing automated test suite; add application/API tests as those flows are hardened.
