> **Scope:** Collect buyer-safe evidence after the first successful commit on a staging or customer pilot tenant.

# First-pilot evidence bundle

**Audience:** Pilot operators, sales engineers, and founders preparing sponsor handoff.

**Last reviewed:** 2026-05-28

---

## When to run

After Phase C step **Commit** in [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) succeeds and before sending a sponsor packet or procurement follow-up.

## One-command proof pipeline

Use this before and after the first committed review. Without `-RunId`, the pipeline produces a readiness-only go/no-go report and records the missing run id as a **WARN**, not a blocking failure. For external sponsor handoff, pass `-SponsorHandoff`; in that mode a missing `-RunId` is a **BLOCK** and the summary emits a `sponsorPacketDisposition` of `SEND`, `HOLD`, or `DEFERRED_SCOPE`.

Optional `-DeferredBuyerRequirement` values document buyer requirements that are explicitly V1.1/V2/(B) (for example `SOC 2 CPA`, `live marketplace checkout`). When V1 proof passes but deferred buyer requirements remain, disposition is `DEFERRED_SCOPE` rather than `SEND`.

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl https://your-staging-api.example `
  -RunId <committed-run-guid> `
  -SponsorHandoff `
  -ProductionLikeHostedPilot `
  -OutputDirectory artifacts/first-pilot-proof
```

The pipeline emits **`first-pilot-command-center.md`** and **`first-pilot-command-center.json`** (primary phased status surface aligned to [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) labels), `go-no-go-summary.md`, `go-no-go-summary.json`, `quote-to-proof-packet.md`, `preflight.json`, `observability-export-readiness.md`, `route-tier-policy-nav-parity.md`, `route-tier-policy-nav-drift.json`, `scale-envelope-evidence.md`, `first-pilot-timing-budget.md`, `admin-operational-posture.md`, `procurement-deal-ready-check.txt`, `procurement-deal-ready-classification.md`, **`data-consistency-readiness/`** (including `data-consistency-summary.json` rolled into `go-no-go-summary.json` as `dataConsistencyProof`), and the committed-run evidence bundle when `-RunId` is supplied. **BLOCK/WARN** rows in `go-no-go-summary.md` include a **`supportNextStep`** column pointing at support-bundle or collector commands (no secrets). Triage IDs in the detailed summary map to [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md).

## First-pilot command center

Open **`first-pilot-command-center.md`** first after proof collection. It rolls up five phases — platform ready, evidence ingest, review lifecycle, sponsor package, procurement posture — using only **READY**, **WARN**, **HOLD**, **DEFERRED**, and one **NEXT ACTION** row. Each **HOLD** phase links to exactly one remediation doc. Deferred V1.1/V2/(B) buyer requirements appear under **DEFERRED** and do not block V1 handoff when `sponsorPacketDisposition` is `DEFERRED_SCOPE`. Without `-RunId`, review lifecycle stays **WARN** (readiness-only); the pipeline does not crash.

`go-no-go-summary.json` includes a `commandCenter` pointer (`jsonPath`, `mdPath`, `readinessOnly`, `nextActionSummary`) for automation.

## GitHub / Azure DevOps workflow handoff (optional)

After proof collection, attach buyer-safe artifacts to an existing PR, issue, or Azure DevOps work item using [`V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md). This path does **not** require Jira, ServiceNow, Confluence, Slack, Teams, CloudEvents, or MCP (V1.1).

## Sponsor handoff disposition rules

| Disposition | When |
| --- | --- |
| `READINESS_ONLY` | Default without `-SponsorHandoff` |
| `SEND` | `-SponsorHandoff`, no blocking findings, and no deferred buyer requirements recorded |
| `HOLD` | Any blocking finding: missing `RunId`, unresolved PilotStrict signals, unsafe ROI basis, data-consistency HOLD, stale procurement pack, route/tier/policy/nav drift, or other BLOCK rows |
| `DEFERRED_SCOPE` | V1 proof passes (`blockCount=0`) but `-DeferredBuyerRequirement` or procurement output documents V1.1/V2/(B) buyer requirements such as SOC 2 CPA, public reference customer, live marketplace checkout, MCP, or first-party ITSM/chat/doc connectors |

`go-no-go-summary.json` includes `blockingReasons`, `deferredScopeReasons`, `dataConsistencyStatus`, `roiBasisStatus`, `roiSponsorSafe`, `aiQualityProof`, and `aiReadinessGate` when proof collection runs.

## Consolidated AI readiness gate

`collect-first-pilot-proof.ps1` emits **`ai-readiness-gate.json`** and **`ai-readiness-gate.md`** with a single **PASS / WARN / HOLD** disposition. The gate rolls up:

| Signal | Source |
| --- | --- |
| Agent execution mode | `pilot-observability-summary.json` → `llmExecutionMode` |
| Quality gate mode / disposition | Host config + per-run PilotStrict signals |
| Faithfulness floor | `pilotStrictMinAgentResultFaithfulnessSupportRatio` |
| Faithfulness/citation observed | Mean citation coverage from `retrieval-grounding.json` (proxy label) |
| Retrieval IR status | Offline `retrieval-ir-report.md` copied into the proof folder |
| LLM budget status | `llm-budget-status.json` when collected |
| Simulator-only posture | Explicit when mode is simulator/WarnOnly — does **not** prove real LLM quality |

**HOLD** on sponsor handoff (`-SponsorHandoff`) when real-mode or PilotStrict configuration exists but sponsor-safe AI evidence is missing or rejected. **WARN** for simulator-only or partial signals. **PASS** only when PilotStrict sponsor-evidence passes with buyer-safe redaction and attested grounding.

## AI Quality Proof

When `-RunId` is supplied, `go-no-go-summary.md` includes an **AI Quality Proof** section and `go-no-go-summary.json` includes `aiQualityProof`. Signals are pulled from `pilot-observability-summary.json` and optional `retrieval-grounding.json` in the committed-run bundle:

| Signal | Meaning |
| --- | --- |
| PilotStrict disposition | Quality gate posture for sponsor evidence |
| Retrieval grounding trace present | Run attests redaction-safe retrieval traces |
| Citation coverage (mean) | Mean citation coverage across grounding rows |
| LLM call count resolved | Real vs simulator LLM posture is known |
| Raw prompt/completion included | Must remain **false** for buyer-safe handoff |
| Secrets included | Must remain **false** for buyer-safe handoff |

Missing signals are labeled **WARN** or **BLOCK** (sponsor handoff) — the pipeline does not invent pass values.

## LLM budget status

When ExecuteAuthority is available, committed-run evidence collection writes `llm-budget-status.json` and includes `llmExecutionMode`, `llmBudgetStatusCollected`, and nested `llmBudgetStatus` in `pilot-observability-summary.json`. First-pilot proof renders `llm-budget-proof-status.md` — buyer-safe UTC-month hard-cap posture without secrets or prompt text.

## First-pilot performance baseline

Optional `-StagingSmokeResultsPath` (or repo-root `artifacts/staging-smoke-results.json`) feeds `first-pilot-performance-baseline.md`. This reports observed step latencies from `./scripts/staging-smoke.ps1` with explicit **not a load test** wording; missing steps are `NOT_RUN`, not zero.

## Hosted availability rollup

When hosted-saas-probe JSON artifacts are supplied via `-HostedProbeArtifactsPath` or `artifacts/hosted-probes/`, proof includes `hosted-availability-rollup.md`. Staging probe uptime is **not** production SLA evidence — see [`HOSTED_AVAILABILITY_ROLLUP.md`](HOSTED_AVAILABILITY_ROLLUP.md).

## Azure extractor and identity preflight

Proof includes `azure-extractor-upload-failure-ux.md` (stable semantic failure codes vs docs/tests) and `identity-preflight-scenarios.md` (redacted OIDC/SAML examples). Operators still run live diagnostics via `archlucid auth diagnostics` and `GET /v1/admin/auth/oidc-diagnostics`.

## Retrieval IR evidence (offline)

When `docs/quality/retrieval-ir-report.md` exists (from `scripts/ci/eval_retrieval_ir.py`), the proof pipeline copies it into the proof folder as `retrieval-ir-report.md` plus optional `retrieval-ir-summary.json`. This measures golden-fixture recall@5/MRR — distinct from live run citation faithfulness.

## Live UI-SQL parity (optional)

Attach release-candidate browser parity with `-LiveUiSqlResultPath` or pre-generate `artifacts/release-smoke-live-ui-sql-result.json` via:

```powershell
./scripts/release-smoke-live-ui-sql.ps1 -ResultOut artifacts/release-smoke-live-ui-sql-result.json
```

Proof copies `live-ui-sql-parity-result.json` (+ Markdown companion). This is **live-api** browser parity against the smoke-started API — not mock Playwright.

## Support summary

Committed-run evidence bundles include `support-summary.md` — a one-page buyer/operator index with base URL, version, health status, run/manifest ids, artifact manifest checksum, correlation-id guidance, and buyer-safe vs internal-only file notes.

## Sponsor artifact evidence badges

Sponsor-facing exports and the review-detail sponsor banner surface **evidence source** and **freshness** badges:

| Badge | Meaning |
| --- | --- |
| Buyer-provided | Tenant-captured ROI baseline posture |
| Uploaded actual/amortized | Extractor or uploaded cost evidence drives pricing |
| Azure Retail catalog | Retail/EA-adjusted list pricing |
| Heuristic fallback | Conservative estimates — review before dollar claims |
| Demo-derived | Sample/demo tenant — not externally publishable |
| Fresh / Stale / Missing / Not collected | Cost evidence collection posture |
| Evidence-backed | Explanation or sponsor row has persisted citations or complete proof fields |
| Estimate | Narrative depends on fallback ROI, defaulted baselines, or deterministic fallback context |
| Low support | PilotStrict or faithfulness evidence is below the sponsor-safe threshold |
| Manual review required | Evidence basis is incomplete or simulator substitution must be disclosed |
| Deferred scope | Buyer ask belongs to explicitly deferred V1.1/V2/(B) scope |

Stale, missing, demo-derived, or heuristic-only badges must **not** be presented as current customer proof in Markdown, PDF, DOCX, or sponsor email.
Low-support, estimate, manual-review-required, or deferred-scope labels require sponsor-safe caveats; they are product evidence labels, not legal/audit attestations.

## Minimum viable ROI baseline (before sponsor readout)

Capture these on the pilot scorecard (`/scorecard`) and confirm `proofPackageCompleteness.roiBaselineInputs` on `GET /v1/pilots/runs/{runId}/pilot-run-deltas` before external send:

| Input | Persisted source | Required basis for projected dollars |
| --- | --- | --- |
| Review-cycle hours | Tenant trial signup or baseline settings | `buyer-provided` (not `defaulted` or `not collected`) |
| Architect prep hours / review | Tenant manual-prep baseline field | `buyer-provided` |
| Evidence assembly cadence | Scorecard `baselineReviewsPerQuarter` | `buyer-provided` |
| Loaded architect hourly cost | Scorecard `baselineArchitectHourlyCost` | `buyer-provided` |

When any field is `defaulted`, `demo-derived`, or `not collected`, the first-value Markdown includes sponsor-safe fallback copy and `projectedDollarClaimsSponsorSafe` is **false** — do not lead sponsor email or banners with projected USD savings from findings rollups. Use qualitative deltas and explicit estimate labels until all four inputs are buyer-provided.

## Committed-run evidence command

```powershell
./scripts/collect-first-pilot-evidence.ps1 `
  -BaseUrl https://your-staging-api.example `
  -RunId <committed-run-guid> `
  -OutputDirectory artifacts/first-pilot-evidence
```

Authentication uses `-BearerToken` / `-ApiKey` or env `ARCHLUCID_BEARER_TOKEN` / `ARCHLUCID_API_KEY` (same as other repo scripts).

## Output

Creates `artifacts/first-pilot-evidence/first-pilot-evidence-<UTC>/` containing:

| Artifact | Purpose |
| --- | --- |
| `run-metadata.json` | Collection stamp, run id, buyer-safe file list |
| `artifact-manifest.json` | SHA-256 checksums for tamper-evident handoff |
| `pilot-run-deltas.json` | Findings summary + proof-package completeness |
| `first-value-report.md` | Sponsor narrative with ROI basis labels |
| `audit-slice-metadata.json` | Recent audit event metadata (no raw payloads) |
| `run-detail-summary.json` | Run/manifest/findings surface |
| `pilot-observability-summary.json`, `pilot-observability-summary.md` | Buyer-safe health, version, OpenAPI, audit sample, manifest, LLM usage, and PilotStrict sponsor-evidence stamp |
| `health-*.json`, `version.json`, `openapi-v1.json` | Environment + contract stamp |
| `README.md` | What each file proves; buyer-safe vs internal-only |

## Email-sized variant

For a single ZIP attachment, use:

```powershell
dotnet run --project ArchLucid.Cli -- buyer-proof-pack <runId> --out proof.zip
```

## AI trust gates in the bundle

Treat `pilot-observability-summary.*` as the fast buyer-safe signal, not the full internal eval record. A committed sponsor handoff should show:

- `llmCallCountResolved=true` when the run is expected to include agent execution traces.
- `qualityGateDisposition=pilot-strict-sponsor-evidence-pass` for PilotStrict hosts.
- `rawPromptOrCompletionIncluded=false` and `secretsIncluded=false`.

If `qualityGateDisposition` is `pilot-strict-violates-sponsor-evidence` or `pilot-strict-signals-unresolved`, pause handoff and use [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](AGENT_QUALITY_STRICT_MODE_PILOT.md) plus [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) before sending the sponsor packet.

## Governance and audit proof artifacts

The proof pipeline also emits buyer-safe governance and audit drift artifacts:

| Artifact | Purpose |
| --- | --- |
| `mutating-route-audit-matrix.md` / `.json` | Confirms POST/PUT/DELETE controller routes appear in [`AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md) or explicit allowlist |
| `governance-policy-pack-dry-run-proof.md` / `.json` | Sample policy-pack dry-run finding reference for architecture-review evidence — **not certification** |

## Related

- Printable checklist: [`FIRST_RUN_EVIDENCE_CHECKLIST.md`](FIRST_RUN_EVIDENCE_CHECKLIST.md)
- Preflight before first run: `dotnet run --project ArchLucid.Cli -- --json pilot preflight`
- Demo go/no-go: `./scripts/verify-demo-workspace.ps1`
