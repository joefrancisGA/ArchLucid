# 13. Authority pipeline stage zoom-ins

Each authority stage emits an OpenTelemetry span with tag `archlucid.stage.name`. Queued and inline paths share the same stage executor.

## Context ingestion

![Context ingestion stage](../architecture_diagrams/archlucid-stage-context-ingestion.svg)

## Knowledge graph

![Knowledge graph stage](../architecture_diagrams/archlucid-stage-knowledge-graph.svg)

## Findings

![Findings stage](../architecture_diagrams/archlucid-stage-findings.svg)

## Decisioning

![Decisioning stage](../architecture_diagrams/archlucid-stage-decisioning.svg)

## Artifacts and finalize

![Artifacts and finalize](../architecture_diagrams/archlucid-stage-artifacts-finalize.svg)

## Detail

See `docs/library/CANONICAL_PIPELINE.md`, `docs/library/BACKGROUND_JOB_CORRELATION.md`, and diagram companions under `docs/architecture/architecture_diagrams/`.
