> **Scope:** ADR 0053 — Enterprise diagnostic logging and observability posture — full detail in sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0053: Enterprise diagnostic logging and observability posture

- **Status:** Accepted
- **Date:** 2026-06-14
- **Deciders:** Architecture / platform engineering
- **Related:** [ADR 0005](0005-llm-completion-pipeline.md) (LLM metrics), [ADR 0035](0035-architecture-invariant-catalog.md) (enforcement waves), [ADR 0041](0041-fail-closed-scope-derivation.md) (scope derivation), TB-004, TB-124–TB-128, TB-329–TB-336
- **Amends:** *(none — extends observability expectations established piecemeal in ADR 0005 and ops docs)*

## Context

ArchLucid is an enterprise architecture review and governance product. Buyers, pilots, and production operators must be able to answer, without ad-hoc log archaeology:

- Why did this review fail?
- What happened to this evidence package?
- Which step was slow?
- Which dependency failed?
- Which AI/model call failed or exceeded budget?
- What did the system do for this tenant/workspace/review?

A **2026-06-14 diagnostic logging assessment** scored observability readiness at **72/100**. The repository already ships a strong foundation: Serilog with OpenTelemetry enrichers, Azure Monitor OpenTelemetry export (Application Insights), ~80 custom meters, GenAI semantic conventions on LLM calls, durable SQL audit (`dbo.AuditEvents`), correlation middleware, and multi-layer privacy redaction (`LogSanitizer`, `PromptRedactor`, `SupportBundleRedactor`).

Gaps are **concentrated**, not systemic: tenant/workspace identity is absent from Activity tags; evidence-package identity is not a standard span dimension; there is no canonical **Do Not Log** policy artifact for developers; production operator runbook coverage for telemetry injection is incomplete relative to fail-fast startup rules.

Enterprise trust requires **near-perfect diagnostic logging** — not a giant observability platform, but **structured, correlated, privacy-safe telemetry** on every review lifecycle transition, every AI call, and every failure path. This bar is comparable to security and tenancy invariants: partial coverage is not acceptable for V1 production supportability.

## Decision

1. **Near-perfect diagnostic logging is a first-class architectural requirement for V1 GA.** Production-like hosts must emit enough structured, correlated telemetry that on-call and customer support can reconstruct a review run end-to-end from Application Insights (or configured OTLP sink) plus durable audit, without reading raw customer evidence or prompts.

2. **Three-layer observability model (normative):**

   | Layer | Purpose | Canonical store / sink |
   | --- | --- | --- |
   | **Durable audit** | Compliance, governance, buyer-facing evidence trail | `dbo.AuditEvents` via `IAuditService` (`AuditEventTypes`) |
   | **Distributed traces + metrics** | Latency, dependency failure, AI cost, pipeline stage timing | OpenTelemetry → Azure Monitor / OTLP / Prometheus |
   | **Structured logs** | Human-readable triage, Serilog request logging, failure detail | Serilog console + App Insights log ingestion when configured |

   These layers are **complementary**. Audit answers "what was recorded for compliance"; traces answer "what was slow or failed"; logs answer "what did the process say at the moment of failure."

3. **Mandatory correlation dimensions** on every request-scoped Activity and log scope where the value is known:

   | Dimension | Activity tag | Serilog `LogContext` | Notes |
   | --- | --- | --- | --- |
   | Correlation | `correlation.id` | `CorrelationId` | Already shipped (`CorrelationIdMiddleware`) |
   | Review / run | `archlucid.run_id` | *(via tag; route-bound)* | Product term is **runId** |
   | Tenant | `archlucid.tenant_id` | *(tag only — avoid log PII duplication)* | **TB-329** |
   | Workspace | `archlucid.workspace_id` | *(tag only)* | **TB-329** |
   | Evidence package | `archlucid.evidence_package_id` | `EvidencePackageId` | **TB-331** — ingest paths only |

4. **Application Insights as primary production telemetry sink.** Use the **Azure Monitor OpenTelemetry exporter** (`AddAzureMonitorTraceExporter` / `AddAzureMonitorMetricExporter`) with `APPLICATIONINSIGHTS_CONNECTION_STRING` or `Observability:AzureMonitor:ApplicationInsightsConnectionString`. Do **not** introduce the classic Application Insights SDK alongside OTel. OTLP and Prometheus remain supported secondary paths per [`docs/library/OBSERVABILITY.md`](../../library/OBSERVABILITY.md).

5. **OpenTelemetry-compatible instrumentation where practical.** Custom spans use `ActivitySource` names in `ArchLucidMeterNames`; LLM calls follow GenAI semantic conventions (`gen_ai.*` tags). New instrumentation must register sources in `ObservabilityExtensions.AddArchLucidOpenTelemetry`.

6. **Structured event naming convention:**

   - **Log event names (when using named events):** lowercase dot-separated — `archlucid.{domain}.{verb}` (example: `archlucid.llm.cost_delta`).
   - **Activity / span names:** lowercase dot-separated domain stages — `authority.{stage}`, `gen_ai.chat.completion`.
   - **Metric names:** snake_case with `archlucid_` prefix — `archlucid_{noun}_{unit}_total`.
   - **Structured log properties:** PascalCase placeholders — `{RunId}`, `{TenantId}`, `{DurationMs}`.

   Canonical lifecycle event catalog: **TB-332** (`DiagnosticEventNames` constants + doc section in `OBSERVABILITY.md`).

7. **Privacy and redaction discipline (non-negotiable):**

   - Maintain a canonical **Do Not Log** reference in code: **`LoggingPolicy.cs`** (**TB-330**).
   - Never log raw customer evidence, full prompts, full model responses, secrets, connection strings, or bearer tokens in production paths.
   - `LlmTelemetry:CapturePromptResponseOnSpans` remains **`false`** in production-like configuration unless superseded by a future ADR with explicit buyer/legal sign-off.
   - User-derived strings at API boundaries must pass through `LogSanitizer` or `SanitizedLogger*` extensions.

8. **Production fail-fast for missing telemetry export** remains enabled when `ProductionValidation:RequireTelemetryExport=true` (`ProductionDangerousMisconfigurationLint`). Operators must follow the injection runbook (**TB-333**).

9. **Enforcement routing:** Implementation gaps close through [`docs/library/TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md) items **TB-329–TB-336**, prioritized Tier 1 before V1 GA sign-off. PRs that add review-lifecycle, evidence, or AI paths without structured telemetry must cite ADR 0053 and the relevant TB item or justify exemption in the PR description.

## Trade-offs

| Choice | Gain | Sacrifice |
| --- | --- | --- |
| Near-perfect logging bar vs "good enough" console logs | Enterprise supportability, pilot reliability, faster MTTR, defensible trust-center posture | Every new lifecycle path carries instrumentation tax; reviewers must enforce correlation tags |
| Activity tags for tenant/workspace vs log-context enrichment | App Insights / OTLP filter by tenant without scanning unstructured logs; lower PII duplication in log lines | Slightly higher cardinality on trace backends; must guard tag values (GUID validation only) |
| OTel + Azure Monitor exporter vs classic App Insights SDK | One pipeline for traces and metrics; GenAI semantic conventions; Prometheus sidecar | Team must learn OTel query models; Azure Portal naming normalization |
| Durable audit + OTel (dual write) | Compliance-grade immutability separate from operational telemetry | Two systems to query; event type strings differ between audit and log layers by design |
| Strict Do Not Log policy | Prevents catastrophic customer-data leaks in logs | Engineers cannot "just log the prompt" for debugging — must use persisted agent traces with access controls |
| Fail-fast on missing telemetry export | Production cannot silently run blind | Staging/local must configure export or disable `RequireTelemetryExport` explicitly |

## Constraints

- **Security:** Logging must never become a secret or customer-evidence exfiltration channel. Redaction precedes persistence in all sinks.
- **Scalability:** Tenant/workspace tags on spans are acceptable; **high-cardinality tenant labels on every metric** require explicit review (**TB-329** limits tags to traces unless approved).
- **Reliability:** Instrumentation must not block user flows — audit best-effort paths remain governed by **TB-001**; telemetry export failure must not fail requests (startup fail-fast applies to **misconfiguration**, not transient export outages).
- **Cost:** App Insights ingestion cost grows with log volume and span count; sampling via `Observability:Tracing:SamplingRatio` is allowed but must be documented (**TB-333**); LLM error spans should remain in `AlwaysSampleActivitySources` where configured.
- **Platform:** Azure-native primary sink; OTLP for multi-backend enterprises; no browser App Insights SDK in V1 (**TB-335** deferred Tier 2).
- **Staffing:** Enforcement through backlog waves (**TB-329–336**), not a big-bang rewrite of ~300 existing log call sites.

## Expected impact

| Area | Impact |
| --- | --- |
| **System** | Every review lifecycle stage, evidence ingest path, and LLM call is queryable by runId and (after TB-329) tenantId in App Insights. Support can answer the six canonical triage questions without database forensics for common failures. |
| **Security posture** | Canonical Do Not Log policy reduces accidental prompt/evidence logging; existing redactors gain a single authoritative reference for PR review. |
| **Operations** | Production operators gain a runbook for connection-string injection, export verification, and sampling policy. Fail-fast startup prevents "silent blind" deployments. |
| **Cost** | Slight increase in App Insights ingestion from additional span tags; offset by faster incident resolution and avoided escalations. Metric cardinality discipline prevents runaway Prometheus/Azure Monitor cost. |
| **Teams** | Backend engineers add correlation tags when touching lifecycle code; support/on-call query App Insights by `archlucid.run_id` / `archlucid.tenant_id`; assessors treat observability gaps as V1 blockers per this ADR. |

## Consequences

- **Positive:** Elevates observability from ops polish to architectural invariant; aligns existing strong instrumentation with enterprise supportability bar; gives assessors and buyers a explicit commitment.
- **Negative:** Tier 1 backlog items (**TB-329–334**) must land before V1 GA observability sign-off; PR reviewers carry a new gate.
- **Follow-ups:** **TB-329–TB-336**; link ADR 0053 from [`docs/library/OBSERVABILITY.md`](../../library/OBSERVABILITY.md) and [`docs/engineering/BUILD.md`](../../engineering/BUILD.md); consider architecture test that fails when new pipeline stages omit Activity spans (future wave).

## Links

- Assessment source: observability assessment 2026-06-14 (readiness score 72/100)
- [`docs/library/OBSERVABILITY.md`](../../library/OBSERVABILITY.md)
- [`docs/library/TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md) — **TB-329–TB-336**
- [`ArchLucid.Core/Audit/AuditEventTypes.cs`](../../../ArchLucid.Core/Audit/AuditEventTypes.cs) — durable audit catalog
- `ArchLucid.Host.Core/Startup/ObservabilityExtensions.cs`
- `ArchLucid.Host.Core/Middleware/CorrelationIdMiddleware.cs`
- `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`
