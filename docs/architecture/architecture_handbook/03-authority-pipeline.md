# 3. Authority pipeline

This chapter is the **review evaluation kernel** (chapter 75), implemented by `AuthorityPipelineStagesExecutor`. It is not architecture synthesis. The former `IReviewEngine` alias of `IAgentExecutor` was removed (EK-01); agent-task execute is `IAgentExecutor` only.

Canonical path after `POST /v1/architecture/request` when the run is evaluated by authority: persist the run, run or queue **AuthorityPipelineStagesExecutor**, then transactional finalize into a golden manifest, decision trace, and outboxes. Create-architecture origin may still persist a run on the same HTTP surface without this sequence being the definition of “an architecture.”

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
