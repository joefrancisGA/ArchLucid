# 3. Authority pipeline

Canonical path after `POST /v1/architecture/request`: persist the run, run or queue **AuthorityPipelineStagesExecutor**, then transactional finalize into a golden manifest, decision trace, and outboxes.

## Diagram

![ArchLucid authority pipeline](../architecture_diagrams/archlucid-authority-pipeline.svg)

## Stages (OpenTelemetry)

| Stage | Span name |
|-------|-----------|
| Context ingestion | `authority.context_ingestion` |
| Knowledge graph | `authority.graph` |
| Findings | `authority.findings` |
| Decisioning | `authority.decisioning` |
| Artifact synthesis | `authority.artifacts` |

Spans carry tag `archlucid.stage.name` for support correlation.

## Detail

See `docs/library/ARCHITECTURE_FLOWS.md` (Flow A0), `docs/library/CANONICAL_PIPELINE.md`, `docs/architecture/architecture_diagrams/archlucid-authority-pipeline.md`.
