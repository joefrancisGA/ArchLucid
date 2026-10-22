# Risk & Tradeoffs — Implementation Prompt Index

Design document: `docs/architecture/analyzer_component.md` (rev 7)

Run these prompts in order. Each step depends on the ones before it.
Do not start a step until the prior step's compile check passes.

## Sequence

| Step | Prompt file | What it builds | Compile scope |
|------|-------------|----------------|---------------|
| 1 | `risk-01-contracts.md` | C# contracts under `ArchLucid.Contracts/Risk/` | `ArchLucid.Contracts` |
| 2 | `risk-02-waf-catalog.md` | WAF tradeoff catalog JSON + loader | `ArchLucid.KnowledgeGraph` |
| 3 | `risk-03-tradeoff-detector.md` | Deterministic tradeoff detection engine + LLM explanation | `ArchLucid.Decisioning` |
| 4 | `risk-04-requirement-smell-detector.md` | Requirement smell detector | `ArchLucid.Decisioning` |
| 5 | `risk-05-concern-synthesizer.md` | LLM-backed concern synthesizer + quality gate | `ArchLucid.Decisioning` |
| 6 | `risk-06-snapshot-and-metrics.md` | SQL DDL, repositories, `RiskSnapshotService`, delta | `ArchLucid.Persistence` + `ArchLucid.Application` |
| 7 | `risk-07-execution-context-elicitation.md` | 7 execution-context intake questions | `ArchLucid.Application` |
| 8 | `risk-08-api-routes.md` | REST routes, OpenAPI, API_CONTRACTS update | `ArchLucid.Api` |
| 9 | `risk-09-ui-screen.md` | The one screen in `archlucid-ui` | `archlucid-ui` |
| 10 | `risk-10-governance-packet.md` | Governance packet extension | `ArchLucid.Application` + `ArchLucid.Api` |

## Guardrails that apply to every step

These come from the design doc standing guardrails and must not be regressed:

1. **Two user-facing buckets only** — evidence-backed and suggested concerns.
   Never co-count in governance packet.
2. **No numeric score, probability, or percentage** in any output, response DTO,
   or UI element.
3. **Suggested concerns never in the governance packet.** Enforce with a test.
4. **Requirement smells raised once, then dismissible.** Never re-raised after
   disposition.
5. **Counterfactual is closed-form** (a statement, not a dialogue). No "why not B?"
   flow in V1.
6. **Behavior-change events and outcome-capture events are separate streams.**
   Different tables, different repositories. The behavior-change stream never
   trains the model.
7. **All SQL DDL in `ArchLucid.sql`** (single-file rule).
8. **One class per file.** Each new class in its own `.cs` file.
9. **Tenant isolation on every query.** `TenantId` on every repository method.
10. **`AuthorityManifestRiskPosture` is marked `[Obsolete]` after Step 3** but
    not deleted.

## Validation gates (from design doc §11)

Run these before declaring the implementation complete:

- **Coverage gate (§11.1):** run the tradeoff detector over 3–5 architectures
  with known single-region-vs-RTO violations. All must be detected, none missed.
- **Principal gate (§11.2):** run the concern synthesizer over 5 real past
  architectures. At least one concern per review must be non-obvious to an
  independent principal architect.
- **Signal-to-noise gate (§11.4):** dismiss rate for suggested concerns must be
  below 40% in the pilot.

Do not commit further engineering after Step 10 without passing the §11 gates
on real architectures.

## Deferred — do not implement in this batch

- Graph risk node/edge types
- Mutable risk lifecycle (waiver/disposition *state*)
- Full remediation advisory (ranked bespoke options)
- Conversational counterfactual advisor ("why not B?" dialogue)
- AWS/GCP pillar framing
- Numeric heatmaps or uncertainty axis
- Per-tenant calibration model training pipeline
