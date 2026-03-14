# ArchiForge

ArchiForge is an API for orchestrating AI-driven architecture design. It coordinates topology, cost, and compliance agents to produce architecture manifests from high-level requests.

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- SQL Server (LocalDB, Express, or full) with a database for ArchiForge
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional; for `archiforge dev up`)

## Development environment (`archiforge dev up`)

From the ArchiForge repo directory (or any directory containing `docker-compose.yml`), run:

```bash
dotnet run --project ConsoleTest -- dev up
```

This starts SQL Server, Azurite, and Redis in Docker. Use this connection string with the API:

```
Server=localhost,1433;Database=ArchiForge;User Id=sa;Password=ArchiForge_Dev_Pass123!;TrustServerCertificate=True;
```

## Database Setup

1. Create a database (e.g. `ArchiForge2`), or use `archiforge dev up` to run SQL Server in Docker.
2. Configure the connection string. Migrations run automatically on startup via [DbUp](https://dbup.readthedocs.io/). Scripts in `ArchiForge.Data/Migrations/` are applied in order; add new `00x_Description.sql` files for schema changes.
3. Store the connection string in User Secrets (development):

   ```bash
   cd ArchiForge.Api
   dotnet user-secrets set "ConnectionStrings:ArchiForge" "Server=localhost;Database=ArchiForge2;Trusted_Connection=True;TrustServerCertificate=True;"
   ```

   For production, use environment variables or your hosting provider's secret store.

## Running the API

```bash
dotnet run --project ArchiForge.Api
```

The API listens on the URLs configured for the project (typically `http://localhost:5xxx` and `https://localhost:7xxx`).

In Development:

- **Swagger UI**: `/swagger`
- **Health check**: `GET /health`

## Running Tests

```bash
dotnet test
```

Integration tests use in-memory SQLite by default—no SQL Server required. The schema is created automatically.

## API Flow

1. **Create run** – `POST /v1/architecture/request`  
   Submit an `ArchitectureRequest` (system name, environment, cloud provider, constraints). Returns a run and agent tasks.

2. **Submit agent results** – `POST /v1/architecture/run/{runId}/result`  
   Submit results from topology, cost, and compliance agents.

3. **Commit** – `POST /v1/architecture/run/{runId}/commit`  
   Merge results and produce a versioned manifest. Requires at least one agent result per run.

4. **Get manifest** – `GET /v1/architecture/manifest/{version}`  
   Retrieve a committed manifest by version.

Other endpoints:

- `GET /v1/architecture/run/{runId}` – Fetch run status, tasks, and results
- `POST /v1/architecture/run/{runId}/seed-fake-results` – (Development only) Seed deterministic fake results for smoke testing

## Project Structure

| Project | Description |
|---------|-------------|
| ArchiForge.Api | ASP.NET Core Web API, controllers, health checks |
| ArchiForge.Contracts | DTOs, request/response types, manifest models |
| ArchiForge.Coordinator | Run creation, task generation |
| ArchiForge.DecisionEngine | Merges agent results into manifests |
| ArchiForge.Data | Repositories, SQL persistence |
