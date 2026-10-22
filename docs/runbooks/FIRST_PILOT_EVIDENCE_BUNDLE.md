> **Reviewed:** 2026-07-28

> **Scope:** Collect buyer-safe evidence after the first successful commit on a staging or customer pilot tenant, plus the operator / pilot-lead evidence packet checklist (formerly the body of `docs/go-to-market/templates/evidence-packet-operator.template.md`; that filename remains a path-stable alias) and the security-reviewer evidence packet (formerly the body of `docs/security/templates/evidence-packet-security-reviewer.template.md`; that filename remains a path-stable alias).

# First-pilot evidence bundle

**Audience:** Pilot operators, sales engineers, and founders preparing sponsor handoff.

**Last reviewed:** 2026-07-28

---

## Role-specific packet templates

Use these when assembling handoff folders — they map artifacts to decision needs without duplicating policy:

| Role | Template |
| --- | --- |
| Buyer / sponsor sponsor | [`evidence-packet-buyer.template.md`](../go-to-market/templates/evidence-packet-buyer.template.md) |
| Operator / pilot lead | [`#operator-pilot-lead-evidence-packet`](#operator-pilot-lead-evidence-packet) · [`evidence-packet-operator.template.md`](../go-to-market/templates/evidence-packet-operator.template.md) (alias) |
| Security reviewer | [`#security-reviewer-evidence-packet`](#security-reviewer-evidence-packet) · [`evidence-packet-security-reviewer.template.md`](../security/templates/evidence-packet-security-reviewer.template.md) (alias) |

Minimum doc routing: [`ROLE_INDEX.md`](ROLE_INDEX.md#v1-critical-path-mandatory-docs) · **First path choice:** [`FIRST_EVALUATOR_DECISION.md`](FIRST_EVALUATOR_DECISION.md).

Optional **generic-AI comparison** rubric when a buyer asks "why not ChatGPT?": [`DIFFERENTIATION_PROOF_PACKET.md`](../go-to-market/DIFFERENTIATION_PROOF_PACKET.md) § Generic-AI comparison exercise.

## Operator / pilot-lead evidence packet {#operator-pilot-lead-evidence-packet}

Former standalone body: `docs/go-to-market/templates/evidence-packet-operator.template.md` → this section (filename kept as a path-stable alias). Minimum artifacts for first pilot and RC signoff.

**Path-stable alias:** [`evidence-packet-operator.template.md`](../go-to-market/templates/evidence-packet-operator.template.md).

**Audience:** Pilot operator, sales engineer, release owner running first value on Staging.

**Canonical sources:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md), [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md).

**Auth default (Staging):** Bearer JWT via `-BearerToken` or `ARCHLUCID_BEARER_TOKEN` — [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../library/RC_TARGET_ENVIRONMENT_MATRIX.md).

### Mandatory for V1 pilot completion

| Step | Artifact / command | Pass criterion |
| --- | --- | --- |
| Platform ready | `archlucid doctor` | Connection OK; auth mode not DevelopmentBypass on Staging |
| First commit | [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) Phase C | Run reaches **Committed** |
| Staging live probes | `capture-staging-readiness-evidence.ps1 -BaseUrl … -BearerToken …` | `/health/live`, `/health/ready`, `/version` PASS |
| RC drill | `v1-rc-drill.ps1 -ApiBaseUrl … -BearerToken …` | `artifacts/v1-rc-drill-result.json` disposition PASS |
| Proof pipeline | `collect-first-pilot-proof.ps1 -RunId …` | `go-no-go-summary.json` with `blockCount=0` for sponsor handoff |

### Mandatory for RC / release signoff

| Artifact | Producer | Notes |
| --- | --- | --- |
| `release-readiness/` bundle | `Emit-ReleaseReadinessEvidence.ps1 -StrictRc -ApiBaseUrl …` | Live rows require Staging URL |
| `rc-go-no-go-verdict.json` | Strict RC emitter | HOLD blocks promotion |
| `deploy-handoff.json` | Strict RC emitter | Missing SHA/version fails strict mode |
| `first-pilot-strict-summary.json` | `Invoke-FirstPilotStrictPath.ps1` | Check `evidenceScope`: `local-plus-staging-live` for contract evidence |

### Optional (recommended before sponsor send)

| Artifact | When |
| --- | --- |
| `support-bundle-*.zip` | Triage or support escalation |
| `admin-operational-posture.md` | Production-like preflight |
| `data-consistency-readiness/` | Multi-tenant or SQL drift concerns |
| `ai-readiness-gate.json` | Real-mode or PilotStrict pilots |

### One-command strict path (hybrid)

```powershell
# Local gates only (CI smoke — NOT Staging contract evidence):
./scripts/Invoke-FirstPilotStrictPath.ps1

# Full Staging contract evidence:
$env:ARCHLUCID_API_BASE_URL = 'https://<staging-host>'
$env:ARCHLUCID_BEARER_TOKEN = '<jwt>'
./scripts/Invoke-FirstPilotStrictPath.ps1
```

### Failure triage

| Symptom | First doc |
| --- | --- |
| HOLD on go/no-go | [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md) |
| Auth 401 on Staging | [`SECURITY.md`](../library/contributor-reference/SECURITY.md) — confirm Bearer, not DevelopmentBypass |
| RC drill FAIL | [`V1_RC_DRILL.md`](../library/V1_RC_DRILL.md) |

### Operator packet related

- This evidence-bundle runbook (canon)
- [`ROLE_INDEX.md`](ROLE_INDEX.md#v1-critical-path-mandatory-docs)

## Security reviewer evidence packet {#security-reviewer-evidence-packet}

Former standalone body: `docs/security/templates/evidence-packet-security-reviewer.template.md` → this section (filename kept as a path-stable alias). Controls map and honest attestation boundaries.

**Path-stable alias:** [`evidence-packet-security-reviewer.template.md`](../security/templates/evidence-packet-security-reviewer.template.md).

**Audience:** Customer security champion, vendor assessor, procurement security questionnaire responder.

**Assessment posture:** Self-assessment and architecture evidence — **not** third-party attestation unless explicitly attached and labeled.

**Canonical sources:** [`trust-center.md`](../go-to-market/trust-center.md), [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md), [`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md).

### Required review artifacts

| Artifact | What it proves | Honest boundary |
| --- | --- | --- |
| [`trust-center.md`](../go-to-market/trust-center.md) | Data handling, subprocessors, control narrative | Self-attested |
| [`SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) | Control mapping readiness | **Not** CPA SOC 2 report — roadmap only |
| [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) | Database-per-tenant + optional RLS (ADR 0037) | Design intent — verify deployed config |
| [`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) | STRIDE coverage | Living document |
| OpenAPI buyer snapshot | API surface boundary | `buyer-contract.openapi.snapshot.json` — excludes `/v1/internal/*` |
| Staging readiness capture | Live auth/TLS/health posture | **Staging** environment — Bearer default |

### Optional (deep dive)

| Artifact | When to request |
| --- | --- |
| `production-profile-preflight.md` | Hosted production-like config review |
| `azure-iac-parity-proof.json` | Azure deployment alignment |
| `managed-identity-verification.json` | Managed identity posture |
| CodeQL / Trivy / Gitleaks CI artifacts | Supply-chain and SAST evidence from release bundle |
| Support bundle (redacted) | Incident or config triage — operator-supplied |

### Strict claim language

- **May claim:** JWT/API key auth modes; SQL tenant isolation design; audit immutability (`DENY UPDATE/DELETE` on audit); webhook HMAC option; private endpoint Terraform modules documented.
- **May not claim:** SOC 2 Type II certification, published third-party pen test, or production pen-test scope without explicit attachment.
- **Live environment:** Contract-authoritative live evidence is **Staging**, not repo-local config lint — [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../library/RC_TARGET_ENVIRONMENT_MATRIX.md).

### Questionnaire accelerators

| Standard ask | Primary doc |
| --- | --- |
| CAIQ / SIG | Procurement pack build + Trust Center |
| Tenant isolation | `TENANT_ISOLATION_DEFENSE_IN_DEPTH.md` |
| API auth | [`SECURITY.md`](../library/contributor-reference/SECURITY.md), [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Subprocessors | Trust Center subprocessor table |

### Security packet related

- [`PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager`](../go-to-market/PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager)
- [`evidence-packet-buyer.template.md`](../go-to-market/templates/evidence-packet-buyer.template.md)

## When to run

After Phase C step **Commit** in [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) succeeds and before sending a sponsor packet or procurement follow-up.

## One-command sponsor packet (committed run)

For a single committed run handoff (buyer-ready folder + optional ZIP), use [`SPONSOR_PACKET.md`](SPONSOR_PACKET.md):

```bash
archlucid sponsor-packet <runId> --out artifacts/sponsor-packet/<runId>
```

## One-command proof pipeline

Use this before and after the first finalized review. Without `-RunId`, the pipeline produces a readiness-only go/no-go report and records the missing run id as a **WARN**, not a blocking failure. For external sponsor handoff, pass `-SponsorHandoff`; in that mode a missing `-RunId` is a **BLOCK** and the summary emits a `sponsorPacketDisposition` of `SEND`, `HOLD`, or `DEFERRED_SCOPE`.

Optional `-DeferredBuyerRequirement` values document buyer requirements that are explicitly V1.1/V2/(B) (for example `SOC 2 CPA`, `live marketplace checkout`). When V1 proof passes but deferred buyer requirements remain, disposition is `DEFERRED_SCOPE` rather than `SEND`.

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl https://your-staging-api.example `
  -RunId <committed-run-guid> `
  -SponsorHandoff `
  -FailOnHold `
  -ProductionLikeHostedPilot `
  -OutputDirectory artifacts/first-pilot-proof
```

`-FailOnHold` exits **1** when `sponsorPacketDisposition` is **HOLD** or consolidated `ai-readiness-gate` is **HOLD**. **WARN** may still exit **0** unless blocking findings are present.

The pipeline emits **`first-pilot-command-center.md`** and **`first-pilot-command-center.json`** (primary phased status surface aligned to [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) labels), `go-no-go-summary.md`, `go-no-go-summary.json`, `quote-to-proof-packet.md`, `preflight.json`, `observability-export-readiness.md`, `route-tier-policy-nav-parity.md`, `route-tier-policy-nav-drift.json`, `scale-envelope-evidence.md`, `first-pilot-timing-budget.md`, `support-bundle-status.json`, `admin-operational-posture.md`, `procurement-deal-ready-check.txt`, `procurement-deal-ready-classification.md`, **`data-consistency-readiness/`** (including `data-consistency-summary.json` rolled into `go-no-go-summary.json` as `dataConsistencyProof`), and the committed-run evidence bundle when `-RunId` is supplied. **BLOCK/WARN** rows in `go-no-go-summary.md` include a **`supportNextStep`** column pointing at support-bundle or collector commands (no secrets). Triage IDs in the detailed summary map to [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md).

## First-pilot command center

Open **`first-pilot-command-center.md`** first after proof collection. It rolls up five phases — platform ready, evidence ingest, review lifecycle, sponsor package, procurement posture — using only **READY**, **WARN**, **HOLD**, **DEFERRED**, and one **NEXT ACTION** row. The top section is buyer-safe after release-owner review; the diagnostics appendix points operators to raw findings and JSON artifacts. Each **HOLD** phase links to exactly one remediation doc. Deferred V1.1/V2/(B) buyer requirements appear under **DEFERRED** and do not block V1 handoff when `sponsorPacketDisposition` is `DEFERRED_SCOPE`. Without `-RunId`, review lifecycle stays **WARN** (readiness-only); the pipeline does not crash.

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

## Decision-change ledger (paid pilot closeout)

For **`-SponsorHandoff`** with **`-RunId`**, the proof pipeline validates an operator-recorded decision-change ledger:

1. Copy [`pilot-decision-ledger.template.json`](../go-to-market/templates/pilot-decision-ledger.template.json) to `artifacts/pilot-decision-ledger/<runId>/ledger.json` (or pass **`-PilotDecisionLedgerPath`**).
2. Record up to **three** decisions under review, any ArchLucid-attributed changes (`findingId`, `evidenceChainId`, `attributionConfidence`), and **sponsorAcceptance.outcome**.
3. When no decisions changed, set **`noDecisionChangesConfirmed`: true** explicitly.

Outputs: **`pilot-decision-ledger.json`**, **`pilot-decision-ledger-report.json`**, **`pilot-decision-ledger-report.md`**. Missing or incomplete ledgers are **BLOCK** on sponsor handoff (triage **FP-T024**). Use **`-SkipDecisionLedger`** only for readiness-only dry runs.

Cohort rollup across pilots:

```powershell
python scripts/ci/aggregate_pilot_decision_ledgers.py `
  --json-out artifacts/pilot-decision-ledger/cohort-summary.json `
  --markdown-out artifacts/pilot-decision-ledger/cohort-summary.md
```

## Paid-pilot baseline readiness (kickoff gate)

For **paid pilots** with projected ROI in sponsor materials, capture baselines **before kickoff**:

1. Copy [`paid-pilot-baseline.template.json`](../go-to-market/templates/paid-pilot-baseline.template.json) to `artifacts/paid-pilot-baseline/<runId>/baseline.json` (or pass **`-PaidPilotBaselinePath`**).
2. Record **`baselineReviewCycleHours`** and **`baselineReviewCycleSource`** (`buyer-provided`, `team-estimate`, …). When deferring capture, set **`waiver.waived`: true** with **`waiver.rationale`**.
3. Validate at kickoff:

```powershell
.\scripts\validate-paid-pilot-baseline-readiness.ps1 `
  -BaselinePath artifacts/paid-pilot-baseline/<runId>/baseline.json `
  -StrictPaidPilot
```

Proof collection emits **`paid-pilot-baseline.json`**, **`paid-pilot-baseline-readiness-report.json`**, **`paid-pilot-baseline-readiness-report.md`**. Missing or HOLD baselines are **BLOCK** on `-SponsorHandoff` (triage **FP-T025**). Use **`-SkipBaselineReadiness`** only for readiness-only dry runs.

## First non-obvious moment (pilot debrief)

After each pilot or principal-architect debrief, record the first confirmed non-obvious finding moment:

1. Copy [`first-non-obvious-moment.template.json`](../go-to-market/templates/first-non-obvious-moment.template.json) to `artifacts/first-non-obvious-moment/<runId>/moment.json` (or pass **`-FirstNonObviousMomentPath`**).
2. Capture **timestamp**, **finding id**, **participant quote** (redacted), **correctness confidence**, and whether it **changed planned action**. When none occurred, set **`notYetObserved`: true** with rationale.
3. Proof collection emits **`first-non-obvious-moment-report.md`** with a **First non-obvious moment** section for debrief review (triage **FP-T026** — WARN when missing).

Cohort rollup:

```powershell
python scripts/ci/aggregate_first_non_obvious_moments.py `
  --json-out artifacts/first-non-obvious-moment/cohort-summary.json `
  --markdown-out artifacts/first-non-obvious-moment/cohort-summary.md
```

## Dismissal-trigger tracking (pilot debrief)

Capture non-adoption or near-dismissal signals after each debrief:

1. Copy [`pilot-dismissal-trigger.template.json`](../go-to-market/templates/pilot-dismissal-trigger.template.json) to `artifacts/pilot-dismissal-triggers/<runId>/dismissal.json` (or pass **`-PilotDismissalTriggerPath`**).
2. Record **primary category**, **evidence snippet** (redacted), **trigger timing** (before/after first committed run), **mitigation attempted**, and **final outcome**. When none occurred, set **`noDismissalObserved`: true**.
3. Proof collection emits **`pilot-dismissal-trigger-report.md`** (triage **FP-T027** — WARN when missing).

Monthly aggregate with trend direction:

```powershell
python scripts/ci/aggregate_pilot_dismissal_triggers.py `
  --month 2026-06 `
  --json-out artifacts/pilot-dismissal-triggers/monthly-2026-06.json `
  --markdown-out artifacts/pilot-dismissal-triggers/monthly-2026-06.md
```

## Top-severity finding challenge (review closeout)

Before sponsor handoff, challenge the highest-severity finding in the architecture package:

1. Copy [`top-severity-finding-challenge.template.json`](../go-to-market/templates/top-severity-finding-challenge.template.json) to `artifacts/top-severity-finding-challenge/<runId>/challenge.json` (or pass **`-TopSeverityFindingChallengePath`**).
2. Confirm **evidence chain completeness** (or document gaps in `evidenceChainCompletenessNotes`).
3. Capture one **counter-argument**, final **adjudication** (`confirmed` / `revised` / `rejected`), **rationale**, and **reviewer identity**.
4. Proof collection emits **`sponsor-packet-appendix-top-severity-finding-challenge.md`** for the sponsor packet (triage **FP-T028** — WARN when missing; **BLOCK** on `-SponsorHandoff` when HOLD).

```powershell
python scripts/ci/report_top_severity_finding_challenge.py `
  --challenge-json artifacts/top-severity-finding-challenge/<runId>/challenge.json `
  --json-out artifacts/top-severity-finding-challenge/<runId>/report.json `
  --markdown-out artifacts/top-severity-finding-challenge/<runId>/report.md `
  --appendix-out artifacts/top-severity-finding-challenge/<runId>/sponsor-appendix.md
```

## 30-day reuse cohort tracker (pilot follow-up)

Track voluntary return behavior at day 7, day 14, and day 30 after pilot kickoff:

1. Copy [`pilot-reuse-cohort-tracker.template.json`](../go-to-market/templates/pilot-reuse-cohort-tracker.template.json) to `artifacts/pilot-reuse-cohort/<runId>/tracker.json` (or pass **`-PilotReuseCohortTrackerPath`**).
2. For each checkpoint, record **usage state**, **voluntary return count**, **assistance mode** (founder-assisted vs independent), and **continuation/dropoff reason**. Use **`not-yet-due`** until the checkpoint date passes.
3. Set **`trackingComplete`: true** only after day-30 is recorded. Proof collection emits **`pilot-reuse-cohort-tracker-report.md`** (triage **FP-T029** — WARN when missing).

Sponsor cohort rollup across pilots:

```powershell
python scripts/ci/aggregate_pilot_reuse_cohort_trackers.py `
  --json-out artifacts/pilot-reuse-cohort/cohort-rollup.json `
  --markdown-out artifacts/pilot-reuse-cohort/cohort-rollup.md
```

## RC real-mode evidence (release-candidate)

Reference real-mode RC evidence uses the **existing CI / owner dev Azure OpenAI configuration** — do not create ad hoc deployments.

| Variable | Purpose |
| --- | --- |
| `ARCHLUCID_CI_REAL_AOAI_ENDPOINT` | CI / golden-cohort endpoint (maps to `ARCHLUCID_REAL_AOAI_TEST_ENDPOINT` locally) |
| `ARCHLUCID_CI_REAL_AOAI_KEY` | CI / golden-cohort key (maps to `ARCHLUCID_REAL_AOAI_TEST_KEY` locally) |
| `ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT` | Deployment name (default **`gpt-4o`** when unset) |

Workflow:

1. **Generate real-mode gate evidence** (owner-approved credentials only — not PR CI):

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

2. **Collect first-pilot proof** with sponsor handoff discipline:

   ```powershell
   .\scripts\collect-first-pilot-proof.ps1 -RunId <committed-run-guid> -SponsorHandoff -FailOnHold
   ```

3. Inspect `go-no-go-summary.json` fields **`realModeEvidenceStatus`**, **`executionModeEvidenceCaptured`**, and **`realModeEvidenceNextAction`**.

**Sponsor handoff rules:**

- **`-SponsorHandoff`** + missing real-mode evidence → **`realModeEvidenceStatus=HOLD`** and **`sponsorPacketDisposition=HOLD`** (via BLOCK finding).
- Readiness-only mode (no `-SponsorHandoff`) may WARN but must not imply real-mode proof exists.
- Movement from controlled pilot to evidence-backed selling requires **founder / release owner** signoff — green technical checks do not advance claim stage automatically.

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

`support-bundle-status.json` checks whether a support bundle or support summary is attached to first-pilot proof and performs a lightweight redaction scan for obvious connection-string, bearer-token, API-key, password, and secret patterns. A redaction finding is **HOLD** and records only file, pattern, and line metadata, never the matched secret value.

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
| `artifact-manifest.json` | SHA-256 checksums for tamper-evident handoff (CLI proof packet) |
| `export-manifest.json` | *(inside API run export ZIP)* per-file SHA-256 + committed manifest hash anchor — verify via `GET /v1/artifacts/runs/{runId}/export/verify` (TB-307 / ADR 0040) |
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

- Printable checklist: [`FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist`](FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist) (`FIRST_RUN_EVIDENCE_CHECKLIST.md` alias)
- Preflight before first run: `dotnet run --project ArchLucid.Cli -- --json pilot preflight`
- Demo go/no-go: `./scripts/verify-demo-workspace.ps1`
