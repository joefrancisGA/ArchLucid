## ArchLucid.Api

ASP.NET Core Web API surface for ArchLucid.

- Exposes versioned `/v1/architecture/*` endpoints for:
  - run lifecycle (request, status, submit result, commit)
  - analysis reports and exports
  - comparisons and replay (end-to-end and export-record diffs)
- Handles:
  - API key authentication and authorization policies
  - rate limiting
  - OpenAPI/Swagger
  - health checks and observability (Serilog + OpenTelemetry)
- **Hosting role** (`Hosting:Role`, env `Hosting__Role`): **`Combined`** (default, local dev), **`Api`** (HTTP; background export jobs depend on **`BackgroundJobs:Mode`**), or **`Worker`** (advisory/archival/outbox + optional durable export queue processor; see **`ArchLucid.Worker`**). A separate Worker process is **not** required for core HTTP paths when **`Hosting:Role`** is **`Combined`** or **`Api`** with in-memory background jobs. Shared DI, persistence bootstrap, health checks, and jobs live in **`ArchLucid.Host.Core`**; the Worker executable references **Host.Core** only (not this assembly).
- **Local dependencies:** default **`docker compose up -d`** (SQL + Azurite + Redis) or SQL-only **`docker compose -f docker-compose.yml -f docker-compose.local.yml up -d`** / **`dotnet run --project ArchLucid.Cli -- dev up --sql-only`** — see **`docker-compose.local.yml`** and **`docs/engineering/CONTAINERIZATION.md`** (Workflow 1b).
- **Background jobs** (`BackgroundJobs:Mode`, env `BackgroundJobs__Mode`): **`InMemory`** (default) processes async export jobs inside the Api/Combined process. **`Durable`** stores work in **SQL** (`dbo.BackgroundJobs`), enqueues **job ids** to **Azure Storage Queue**, writes results to **blob** (`BackgroundJobs:ResultsContainerName`), and runs work on the **Worker** (`BackgroundJobQueueProcessorHostedService`). Requires **`ArchLucid:StorageProvider=Sql`**, **`ArtifactLargePayload:BlobProvider=AzureBlob`**, and either **`BackgroundJobs:QueueServiceUri`** or a derivable **`ArtifactLargePayload:AzureBlobServiceUri`** (`.blob.` → `.queue.`).

When changing API behavior, prefer to:

- Keep controllers thin and delegate to `ArchLucid.Application` services.
- Keep persistence details in `ArchLucid.Persistence.Data.*` repositories.

See:

- `docs/ARCHITECTURE_CONTAINERS.md`
- `docs/ARCHITECTURE_COMPONENTS.md`
- `docs/COMPARISON_REPLAY.md`

