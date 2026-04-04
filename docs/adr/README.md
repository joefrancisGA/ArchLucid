# Architecture Decision Records (ADR)

**Last reviewed:** 2026-04-04

Short, durable decisions for ArchiForge. Each file is **immutable** once accepted; supersede with a new ADR rather than rewriting history.

| ADR | Title |
|-----|--------|
| [0001](0001-hosting-roles-api-worker-combined.md) | Hosting roles: Api, Worker, Combined |
| [0002](0002-dual-persistence-architecture-runs-and-runs.md) | Dual persistence: ArchitectureRuns vs dbo.Runs |
| [0003](0003-sql-rls-session-context.md) | SQL RLS and SESSION_CONTEXT |
| [0004](0004-transactional-outbox-retrieval-indexing.md) | Transactional outbox for retrieval indexing |
| [0005](0005-llm-completion-pipeline.md) | LLM completion pipeline, cache, quota, metrics |
| [0006](0006-url-path-api-versioning.md) | URL-path API versioning (`/v1`) |

**When to add an ADR:** Cross-cutting choice affecting security, data, or ops; multiple valid alternatives; cost of reversal is high.
