> **Reviewed:** 2026-07-27

> **Scope:** TB-167 — Sponsor AI readiness posture artifact plus buyer-safe AI evidence inventory (formerly `AI_EVIDENCE_APPENDIX.md`), the deeper RAG quality program (formerly `DEEPER_RAG_QUALITY_PROGRAM.md`), and the buyer-facing AI decision-support limits brief (formerly the body of `AI_OUTPUT_DECISION_SUPPORT.md`; that filename remains a path-stable pack alias). Composes execution mode, quality-gate results, retrieval posture, and budget posture into one sponsor-safe summary. This document describes the artifact schema and how to produce it; the actual per-release artifact lives in `artifacts/release/ai-readiness-posture.md` (and `.json`).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# AI readiness posture artifact

**Audience:** Pilot sponsors, sponsor buyers, and proof-packet reviewers who need a single artifact summarizing ArchLucid's AI evidence quality, retrieval posture, and budget posture without reading multiple technical evidence files.

**Last reviewed:** 2026-07-27

**Related:** [`#ai-output-is-decision-support`](#ai-output-is-decision-support), [`#buyer-safe-evidence-inventory`](#buyer-safe-evidence-inventory), [`#deeper-rag-quality-program`](#deeper-rag-quality-program), [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md), `docs/quality/RELEASE_CLAIM_GATE.md`, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `scripts/collect-first-pilot-proof.ps1`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`.

---

## 1. Purpose and scope

This artifact composes the following evidence signals into one concise sponsor-safe summary:

- **Execution mode** per agent path (simulator, local-owner-dev real mode, partial real mode, mixed, not run)
- **Quality-gate posture** (structural validity, semantic score, faithfulness/support ratio when available, PASS/WARN/HOLD outcome, caveats)
- **Retrieval posture** (vector index type, Azure AI Search vs in-memory, tenant filtering, grounding availability, degraded/missing retrieval)
- **Budget posture** (configured LLM budget, observed/estimated token usage and cost, kill-switch/budget guard status)
- **Sponsor-safe summary paragraph** (non-technical; omits raw prompts, secrets, unredacted customer evidence)

This artifact **reuses** existing evidence outputs (real-llm-evidence-gate, retrieval IR report, LLM cost rollup). It is not a second quality gate or ROI truth source.

---

## 2. Artifact schema (`ai-readiness-posture.json`)

```json
{
  "$schema": "archlucid.ai-readiness-posture.v1",
  "generatedUtc": "<ISO-8601 timestamp>",
  "releaseOrRunId": "<version tag, run ID, or 'pilot-YYYY-MM-DD'>",
  "overallReadinessLevel": "<FULL_REAL_MODE | PARTIAL_REAL_MODE | SIMULATOR_ONLY | NOT_EVALUATED>",

  "executionMode": {
    "Topology":   "<real | simulator | partial-real | mixed | not-run>",
    "Cost":       "<real | simulator | partial-real | mixed | not-run>",
    "Compliance": "<real | simulator | partial-real | mixed | not-run>",
    "Critic":     "<real | simulator | partial-real | mixed | not-run>"
  },

  "qualityGate": {
    "outcome":               "<PASS | WARN | HOLD | NOT_RUN>",
    "structuralValidity":    "<pass | warn | fail | not-checked>",
    "semanticScore":         "<0.0-1.0 or null if not available>",
    "faithfulnessRatio":     "<0.0-1.0 or null if not available>",
    "supportRatio":          "<0.0-1.0 or null if not available>",
    "qualityGateSource":     "<path to real-llm-evidence-gate.json or 'not-available'>",
    "caveats":               ["<list of caveat strings, or empty>"]
  },

  "retrievalPosture": {
    "vectorIndexType":       "<azure-ai-search | in-memory | not-configured>",
    "tenantFilteringActive": "<true | false | unknown>",
    "groundingAvailable":    "<true | false | degraded | not-configured>",
    "retrievalStatus":       "<healthy | degraded | missing | not-evaluated>",
    "retrievalEvidenceRef":  "<path to retrieval-ir-report.md or 'not-available'>",
    "caveats":               ["<list of caveat strings, or empty>"]
  },

  "budgetPosture": {
    "configuredLlmBudgetUsd":   "<number or null if not configured>",
    "observedCostUsd":          "<number or null if not captured>",
    "estimatedCostPerRunUsd":   "<number or null if not estimated>",
    "tokenUsageCaptured":       "<true | false>",
    "killSwitchActive":         "<true | false | unknown>",
    "budgetGuardStatus":        "<enforced | warn-only | not-configured>",
    "costEvidenceRef":          "<path to real-llm-cost-rollup.json or 'not-available'>",
    "caveats":                  ["<list of caveat strings, or empty>"]
  },

  "sponsorSafeSummary": "<Plain-English paragraph for sponsor packet — see Section 3>",

  "internalDiagnosticRefs": [
    "<path to real-llm-evidence-gate.json>",
    "<path to retrieval-ir-report.md>",
    "<path to real-llm-cost-rollup.json>",
    "<path to release claim gate markdown>"
  ]
}
```

---

## 3. Sponsor-safe summary paragraph — writing rules

The `sponsorSafeSummary` paragraph must:

- Describe the overall readiness level in plain English without jargon.
- Name which agent paths were run in real mode (if any) and which were not.
- State the quality-gate outcome honestly (PASS/WARN/HOLD/not run).
- Acknowledge missing retrieval or missing cost data explicitly rather than omitting them.
- Never imply a stronger posture than the evidence supports.
- Omit raw prompts, API keys, unredacted customer evidence, or raw retrieved text.

**Template by overall readiness level:**

**FULL_REAL_MODE (all four agents, PASS):**
> "ArchLucid AI evidence for this release was validated in full real-mode using live Azure OpenAI. All four agent paths — Topology, Cost, Compliance, and Critic — passed the quality gate with structural validity confirmed and semantic/faithfulness scores within the configured floor. Retrieval is [healthy/degraded]. LLM budget is [configured at $X per run / not configured]. Token usage capture is [enabled / not captured for this run]."

**PARTIAL_REAL_MODE (subset of agents):**
> "ArchLucid AI evidence for this release is partially validated in real mode. [List of real-mode agents] passed the real-mode quality gate. [List of remaining agents] ran in simulator mode or were not evaluated. Retrieval is [status]. Budget posture: [budget summary]. Claims for non-real-mode agents are limited to simulator-only posture."

**SIMULATOR_ONLY:**
> "This release has not been validated against live Azure OpenAI. All four agent paths (Topology, Cost, Compliance, Critic) ran in simulator mode. Retrieval is [status]. No real-mode token cost data is available. Sponsor materials from this release must use simulator-only claim language."

**NOT_EVALUATED:**
> "AI readiness has not been evaluated for this release. No real-mode or simulator evidence artifact is attached. All AI evidence claims are not applicable. Owner review required before this artifact is included in a sponsor packet."

---

## 4. Overall readiness level rules

| Level | Conditions |
| --- | --- |
| `FULL_REAL_MODE` | All four agent paths are `real` execution mode; quality gate is `PASS`; evidence artifact is present and fresh (≤ 30 days) |
| `PARTIAL_REAL_MODE` | At least one agent path is `real` but not all four; or quality gate is `WARN`; or evidence is present but stale |
| `SIMULATOR_ONLY` | All agent paths are `simulator` or `not-run`; or simulator-only override is active |
| `NOT_EVALUATED` | No evidence artifact present and no override record |

**Fail-safe rule:** Missing retrieval, missing cost data, failed quality gates, or HOLD real-mode evidence must **never** produce a `FULL_REAL_MODE` or green/pass summary. They produce `PARTIAL_REAL_MODE`, `SIMULATOR_ONLY`, or caveats in the applicable section.

---

## 5. How to produce the artifact

### 5.1 Automated path (preferred for release-candidate runs)

```powershell
# Step 1: Generate real-mode evidence (requires AOAI credentials).
.\scripts\Invoke-RealLlmEvidenceGate.ps1

# Step 2: Generate the AI readiness posture JSON from evidence outputs.
.\scripts\Write-AiReadinessPosture.ps1

# Step 3: Include artifact in first-pilot proof bundle (also runs Write-AiReadinessPosture.ps1 into the proof folder).
.\scripts\collect-first-pilot-proof.ps1
```

### 5.2 Manual path (when release evidence inputs are missing)

1. Fill in `ai-readiness-posture.json` using the schema in Section 2.
2. Source execution mode from `artifacts/release/real-llm-evidence-gate.json` or operator knowledge.
3. Source quality gate outcome from `artifacts/release/real-llm-evidence-gate.json`.
4. Source retrieval posture from `docs/quality/retrieval-ir-report.md` or operator knowledge.
5. Source budget posture from `artifacts/release/real-llm-cost-rollup.json` or operator knowledge.
6. Write the sponsor-safe summary paragraph following Section 3 rules.
7. Place artifact at `artifacts/release/ai-readiness-posture.json` and `artifacts/release/ai-readiness-posture.md`.

### 5.3 Script status

`scripts/Write-AiReadinessPosture.ps1` is **shipped (TB-182 / TB-167)**. `scripts/collect-first-pilot-proof.ps1` invokes it and emits `ai-readiness-posture.json` / `.md` on every proof folder. Use the manual path in §5.2 only when release inputs are absent and you need a one-off posture file.

---

## 6. Where to embed the artifact

| Destination | How to embed |
| --- | --- |
| Sponsor proof packet | Include `ai-readiness-posture.md` in the proof ZIP; link from cover page |
| Release evidence collection | Include JSON at `artifacts/release/ai-readiness-posture.json` |
| Commercial closeout (`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`) | Reference `overallReadinessLevel` and `qualityGate.outcome` in quality-posture row |
| Procurement/security packet (`BUYER_SECURITY_PROCUREMENT_PACKET.md`) | Link to `ai-readiness-posture.md` under AI/LLM control evidence |
| Release notes | Quote `sponsorSafeSummary` under "AI evidence posture" section |

---

## 7. Example artifact (simulator-only, V1 pilot)

```json
{
  "$schema": "archlucid.ai-readiness-posture.v1",
  "generatedUtc": "2026-06-01T00:00:00Z",
  "releaseOrRunId": "v1.0.0-pilot",
  "overallReadinessLevel": "SIMULATOR_ONLY",

  "executionMode": {
    "Topology":   "simulator",
    "Cost":       "simulator",
    "Compliance": "simulator",
    "Critic":     "simulator"
  },

  "qualityGate": {
    "outcome":               "NOT_RUN",
    "structuralValidity":    "not-checked",
    "semanticScore":         null,
    "faithfulnessRatio":     null,
    "supportRatio":          null,
    "qualityGateSource":     "not-available",
    "caveats":               ["No live Azure OpenAI deployment configured for this environment."]
  },

  "retrievalPosture": {
    "vectorIndexType":       "in-memory",
    "tenantFilteringActive": true,
    "groundingAvailable":    true,
    "retrievalStatus":       "healthy",
    "retrievalEvidenceRef":  "docs/quality/retrieval-ir-report.md",
    "caveats":               []
  },

  "budgetPosture": {
    "configuredLlmBudgetUsd":   10.0,
    "observedCostUsd":          null,
    "estimatedCostPerRunUsd":   null,
    "tokenUsageCaptured":       false,
    "killSwitchActive":         true,
    "budgetGuardStatus":        "enforced",
    "costEvidenceRef":          "not-available",
    "caveats":                  ["Token usage not captured — no live AOAI calls in simulator mode."]
  },

  "sponsorSafeSummary": "This release has not been validated against live Azure OpenAI. All four agent paths (Topology, Cost, Compliance, Critic) ran in simulator mode. Retrieval is healthy using in-memory vector index with tenant filtering active. No real-mode token cost data is available. Sponsor materials from this release must use simulator-only claim language.",

  "internalDiagnosticRefs": [
    "docs/quality/retrieval-ir-report.md"
  ]
}
```

---

## AI output is decision support {#ai-output-is-decision-support}

Former standalone body: `docs/go-to-market/AI_OUTPUT_DECISION_SUPPORT.md` → this section (filename kept as a path-stable pack alias).

**Audience:** Sponsors, procurement, and security reviewers evaluating ArchLucid outputs.

ArchLucid uses AI to accelerate architecture review. **AI-generated text is decision support.** Your team approves final decisions using persisted evidence, not model prose alone.

### What you can rely on

| Evidence type | Role |
| --- | --- |
| Finalized architecture package | Frozen package identity and timestamps (API: golden manifest) |
| Findings and severity | Structured outputs tied to evidence references |
| Execution traces and audit rows | Durable, exportable activity with correlation ids |
| Evidence-chain pointers | Links from findings back to snapshots and manifests |
| Governance records | Policy packs, approvals, and pre-finalize gates when enabled |

### What requires human judgment

- Whether a recommendation fits your organizational standards
- Whether projected ROI or cycle-time savings apply to your estate
- Whether demo or simulator runs represent customer outcomes

### Evidence-basis labels (on exports)

Sponsor and operator surfaces use shared labels from [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md):

| Label | Meaning |
| --- | --- |
| **Evidence-backed** | Persisted citations or complete proof fields support the narrative |
| **Estimate** | Fallback ROI, defaulted baselines, or heuristic context |
| **Low support** | Faithfulness or PilotStrict evidence below sponsor-safe threshold |
| **Demo-derived** | Sample/demo workspace — illustrative only |
| **Manual review required** | Incomplete evidence or simulator substitution must be disclosed |
| **Deferred scope** | Buyer ask is outside current V1 readiness |

These labels describe **product evidence posture**, not legal, compliance, or audit attestation.

### Limits we do not claim

- Formal verification of AI recommendations
- Guaranteed correctness in all enterprise contexts
- SOC 2 CPA attestation or completed third-party penetration testing (see [`trust-center.md`](trust-center.md) and [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md))

### Deeper technical evidence

- [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) — Limits of AI explanations
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`#buyer-safe-evidence-inventory`](#buyer-safe-evidence-inventory) — repository AI evidence index

---

## 8. Buyer-safe evidence inventory {#buyer-safe-evidence-inventory}

> Index of **current** AI evidence in the repository. Does **not** claim third-party validation or fresh live-model proof unless explicitly noted. Former standalone: `AI_EVIDENCE_APPENDIX.md`.

### What is measured offline (deterministic CI)

| Evidence | Command / artifact | What it proves |
| --- | --- | --- |
| RAG faithfulness golden cohort | `python scripts/ci/eval_agent_faithfulness.py` → `docs/quality/faithfulness-report.md` | Positive readiness support ratio on normal fixtures, plus separate negative-control and combined diagnostic cohorts |
| Retrieval IR harness | `python scripts/ci/eval_retrieval_ir.py` | Recall/MRR on golden queries (offline) |
| Agent output quality gate | `python scripts/ci/eval_agent_corpus.py --enforce-quality-gate` | Schema, policy, and corpus checks on simulator outputs |
| Faithfulness + retrieval trend rollup | `./scripts/ci/Invoke-FaithfulnessTrendReport.ps1` (`-EnforceFaithfulness` optional) | Single Markdown/JSON artifact for assessment and release notes; floor override via `ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO` |
| Deeper RAG quality program (offline) | `python scripts/ci/run_rag_quality_program.py` (`--enforce` optional) | Sequences faithfulness eval, retrieval IR, floor ratchet, and optional rollup — see [`#deeper-rag-quality-program`](#deeper-rag-quality-program) |
| RAG live-model faithfulness signal | `python scripts/ci/run_rag_live_model_faithfulness_signal.py` (`--enforce` optional) | Phase B p50/adversarial floors on committed real-mode exemplars; nightly in golden-cohort workflow |

### Current live Azure OpenAI evidence

| Evidence | Status | Notes |
| --- | --- | --- |
| Topology smoke (real Azure OpenAI) | **Gate profile: `topology-only`** | Proves completion path, JSON parsing, `evidenceRefs`, and `parseFailures=0` for one Topology agent. Does **not** prove full multi-agent merge or sponsor-safe manifest completeness. Metrics: `artifacts/release/real-llm-topology-metrics.json` |
| Full pipeline (real Azure OpenAI) | **Gate profile: `full-pipeline`** | Proves Topology + Compliance + Cost + Critic with merge success, manifest service count, and decision count. Required before claiming full real-LLM validation. Metrics: `artifacts/release/real-llm-full-pipeline-metrics.json` |
| Real-LLM evidence gate | **Skip-graceful; distinct dispositions** | `.\scripts\Invoke-RealLlmEvidenceGate.ps1` or `.\scripts\ci\Invoke-RealLlmGoldenCohort.ps1` writes `SKIPPED_NO_CREDENTIALS` (exit 0, not a pass), `PASS`, or `HOLD`. Optional workflow: `.github/workflows/real-llm-golden-cohort.yml` |
| Session record | **Template + dated session** | `docs/quality/REAL_LLM_SESSION_<date>.md` — generated by `scripts/ci/Invoke-RealLlmGoldenCohort.ps1` / `scripts/ci/build_real_llm_session_record.py` |
| `ai-readiness-gate.json` on sponsor handoff | **Required when real-mode configured** | Emitted by `collect-first-pilot-proof.ps1 -SponsorHandoff` |

### Buyer-safe interpretation

- **Session status vocabulary:** `PASS` (gate PASS; owner checklist may still be open), `WARN`, `HOLD`, `INCOMPLETE` (generated but missing human/template fields), `SKIPPED_NO_CREDENTIALS` (no live run). Only `PASS` with completed owner review is release-usable for G5.
- **Simulator** outputs are repeatable and cost-bounded; they do **not** prove semantic quality under your deployment model.
- **Faithfulness reports** should cite the positive readiness support ratio for quality posture and use negative-control results only to explain detector behavior.
- **Current live evidence** distinguishes **topology smoke** (`topology-only`) from **full pipeline** (`full-pipeline`). Topology smoke does not prove broad real-LLM quality, production SLA, full multi-agent merge success, SOC 2, or third-party validation.
- **Real** outputs must carry model/deployment metadata in run provenance and pass PilotStrict when used for sponsor-safe wording.
- **Unsupported ROI/cost claims** in faithfulness fixtures are flagged (`unsupported-roi-cost-claim`) — sponsor reports now include per-metric source classification.

### Related (internal depth)

- [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)
- [`../library/RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md)
- [`trust-center.md`](trust-center.md)
- [`#deeper-rag-quality-program`](#deeper-rag-quality-program)

---

## Deeper RAG quality program

Release engineering program for **offline RAG quality** — sequences existing faithfulness, retrieval IR, and floor-ratchet harnesses into one enforceable gate. Implements assessment **§17 #10 (Deeper RAG quality program)**. Not buyer-facing narrative.

This program answers one question for engineering and release: **are Ask/agent outputs still citing retrieved evidence and retrieving the right chunks on golden fixtures, without silent regression?** It reuses the TB-021 harness stack documented in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) and [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md); it does not restate retrieval architecture those docs own.

### Program phases (offline, deterministic)

| Phase | Harness | What it measures | Primary artifact |
| --- | --- | --- | --- |
| **1 — Output faithfulness** | `scripts/ci/eval_agent_faithfulness.py` | Citation coverage in agent text (`sourceId` / title substring match; mirrors `RetrievalFaithfulnessEvaluator`) | `docs/quality/faithfulness-report.md`, `faithfulness-summary.json` |
| **2 — Retrieval IR** | `scripts/ci/eval_retrieval_ir.py` | Recall@5, MRR, PolicyPack ordering-sensitive NDCG@10 on golden queries | `docs/quality/retrieval-ir-report.md`, `retrieval-ir-summary.json` |
| **3 — Committed floor ratchet** | `scripts/ci/assert_faithfulness_ir_floor_ratchet.py` | Regression guard vs `tests/eval-datasets/faithfulness-ir-floors.json` | CI stderr on breach |
| **4 — Pilot-proof rollup (optional)** | `scripts/ci/report_retrieval_quality_rollup.py` | Combined IR + faithfulness disposition for first-pilot proof packets | `docs/quality/rag-quality-program-rollup.{md,json}` |

Phase B live-model faithfulness (LLM-graded golden cohort on committed exemplars) runs via `scripts/ci/run_rag_live_model_faithfulness_signal.py` — wired into golden-cohort nightly and optional `--include-live-model` on `run_rag_quality_program.py`. Live OpenAI invoke remains on `eval_agent_corpus.py` / golden-cohort live jobs when budget allows.

### Phase B — live-model faithfulness signal

| Step | Harness | What it measures | Artifact |
| --- | --- | --- | --- |
| **5 — Live-model signal** | `scripts/ci/run_rag_live_model_faithfulness_signal.py` | Phase B p50 / absolute / adversarial LLM faithfulness on committed `*.real.json` exemplars | `docs/quality/rag-live-model-faithfulness-summary.{json,md}` |

Nightly: `.github/workflows/golden-cohort-nightly.yml` job `cohort-rag-live-model-faithfulness` (enforce when repo var `ARCHLUCID_RAG_LIVE_MODEL_FAITHFULNESS_ENFORCE=true`).

### Golden dataset coverage (expanded 2026-06-27)

| Dataset | Cases | Corpus kinds covered |
| --- | ---: | --- |
| `tests/eval-datasets/retrieval-golden/cases.json` | **53** | PolicyPack, PriorManifest, PlatformDoc, AzureRetail, DemoDerived, CustomerProvided, **ReferenceArchitecture** (Topology exemplar style-prior fingerprints) + tenant-isolation |
| `tests/eval-datasets/faithfulness-golden/cases.json` | **33** | Ask-shaped positive + negative controls across all major corpus kinds |

Manifest: `scripts/ci/data/rag_golden_dataset_manifest.v1.json`.

### Unified runner

`scripts/ci/run_rag_quality_program.py` executes phases 1–3 (and phase 4 unless `--skip-rollup`) and writes a program summary:

- `docs/quality/rag-quality-program-summary.json`
- `docs/quality/rag-quality-program-summary.md`

Use `--include-live-model` to append Phase B committed-exemplar faithfulness after offline steps.

Use `--enforce` for merge-blocking runs (same semantics as the underlying harness `--enforce` flags plus ratchet failure).

### Golden fixture coverage (RAG-V1-005 design half)

Output-side citation faithfulness on policy-pack and Ask-shaped scenarios lives in `tests/eval-datasets/faithfulness-golden/cases.json`:

- **Positive readiness:** policy-pack identity, AI governance, healthcare regulatory, Azure SaaS readiness rows with required `sourceId` citations.
- **Negative controls:** missing citation, wrong corpus, unsupported ROI/cost, deferred-scope compliance claims.

Retrieval-side golden queries live in `tests/eval-datasets/retrieval-golden/cases.json` with per-corpus floors (PolicyPack MRR and ordering-sensitive NDCG@10; **ReferenceArchitecture** MRR for Topology exemplar fingerprint regressions; **PriorManifest** operator corpus guidance in [`PRIOR_MANIFEST_RETRIEVAL_GUIDE.md`](../library/customer-facing/PRIOR_MANIFEST_RETRIEVAL_GUIDE.md)). Output-side citation faithfulness (**RAG-V1-005**) is a separate harness in `tests/eval-datasets/faithfulness-golden/cases.json`.

### Verification

```powershell
python scripts/ci/run_rag_quality_program.py
python scripts/ci/run_rag_quality_program.py --enforce --include-live-model
python scripts/ci/run_rag_live_model_faithfulness_signal.py --enforce
python -m pytest scripts/ci/tests/test_run_rag_quality_program.py scripts/ci/tests/test_run_rag_live_model_faithfulness_signal.py
python -m pytest scripts/ci/tests/test_eval_agent_faithfulness.py scripts/ci/tests/test_assert_faithfulness_ir_floor_ratchet.py
```

Nightly golden-cohort workflow already runs faithfulness with `--enforce` on main; this program adds the single entry point for local RC and assessment rescoring.

### Residual (live-model / pilot half)

Offline golden fixtures do **not** prove semantic quality under a customer's deployment model or corpus drift in production. Pair this program with:

- Real-mode golden cohort when credentials are configured (`Invoke-RealLlmGoldenCohort.ps1`).
- First-pilot proof rollup attachment when RAG claims are in the sponsor packet (`collect-first-pilot-proof.ps1`).

Further RAG backlog items (graph RAG, reranker, live corpus freshness dashboards) remain in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) — pick up via **TB-021** scheduling, not ad hoc in assessment batches.

Former standalone: `docs/go-to-market/DEEPER_RAG_QUALITY_PROGRAM.md` → this section.

---

## 9. References

| Document | Purpose |
| --- | --- |
| `docs/quality/RELEASE_CLAIM_GATE.md` | Release claim gate documentation (TB-166) |
| `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` | Template for real-mode run evidence |
| `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` | Golden cohort gate runbook |
| `docs/library/AGENT_OUTPUT_EVALUATION.md` | Agent output evaluation framework |
| [`#ai-output-is-decision-support`](#ai-output-is-decision-support) · [`AI_OUTPUT_DECISION_SUPPORT.md`](AI_OUTPUT_DECISION_SUPPORT.md) (alias) | Buyer-facing AI decision-support limits |
| [`#buyer-safe-evidence-inventory`](#buyer-safe-evidence-inventory) | Buyer-safe AI evidence index (sponsor packets) |
| [`#deeper-rag-quality-program`](#deeper-rag-quality-program) | Offline RAG quality program (phases + runner) |
| [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) | Canonical assurance wording |
| `scripts/Invoke-RealLlmEvidenceGate.ps1` | Generates real-mode evidence artifact |
| `scripts/collect-first-pilot-proof.ps1` | Assembles first-pilot proof bundle |
| `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise` | GTM overclaim guardrails |
