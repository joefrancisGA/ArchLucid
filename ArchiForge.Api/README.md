## ArchiForge.Api

ASP.NET Core Web API surface for ArchiForge.

- Exposes versioned `/v1/architecture/*` endpoints for:
  - run lifecycle (request, status, submit result, commit)
  - analysis reports and exports
  - comparisons and replay (end-to-end and export-record diffs)
- Handles:
  - API key authentication and authorization policies
  - rate limiting
  - OpenAPI/Swagger
  - health checks and observability (Serilog + OpenTelemetry)

When changing API behavior, prefer to:

- Keep controllers thin and delegate to `ArchiForge.Application` services.
- Keep persistence details in `ArchiForge.Data` repositories.

See:

- `docs/ARCHITECTURE_CONTAINERS.md`
- `docs/ARCHITECTURE_COMPONENTS.md`
- `docs/COMPARISON_REPLAY.md`

