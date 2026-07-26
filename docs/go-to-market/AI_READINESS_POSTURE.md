> **Reviewed:** 2026-07-26

> **Scope:** TB-167 — Sponsor AI readiness posture artifact plus buyer-safe AI evidence inventory (formerly `AI_EVIDENCE_APPENDIX.md`). Composes execution mode, quality-gate results, retrieval posture, and budget posture into one sponsor-safe summary. This document describes the artifact schema and how to produce it; the actual per-release artifact lives in `artifacts/release/ai-readiness-posture.md` (and `.json`).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# AI readiness posture artifact

**Audience:** Pilot sponsors, executive buyers, and proof-packet reviewers who need a single artifact summarizing ArchLucid's AI evidence quality, retrieval posture, and budget posture without reading multiple technical evidence files.

**Last reviewed:** 2026-07-26

**Related:** [`#buyer-safe-evidence-inventory`](#buyer-safe-evidence-inventory), `docs/quality/RELEASE_CLAIM_GATE.md`, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `scripts/collect-first-pilot-proof.ps1`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`.

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
| Commercial closeout (`COMMERCIAL_CONVERSION_CHECKLIST.md`) | Reference `overallReadinessLevel` and `qualityGate.outcome` in quality-posture row |
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

## 8. Buyer-safe evidence inventory

> Index of **current** AI evidence in the repository. Does **not** claim third-party validation or fresh live-model proof unless explicitly noted. Former standalone: `AI_EVIDENCE_APPENDIX.md`.

### What is measured offline (deterministic CI)

| Evidence | Command / artifact | What it proves |
| --- | --- | --- |
| RAG faithfulness golden cohort | `python scripts/ci/eval_agent_faithfulness.py` → `docs/quality/faithfulness-report.md` | Positive readiness support ratio on normal fixtures, plus separate negative-control and combined diagnostic cohorts |
| Retrieval IR harness | `python scripts/ci/eval_retrieval_ir.py` | Recall/MRR on golden queries (offline) |
| Agent output quality gate | `python scripts/ci/eval_agent_corpus.py --enforce-quality-gate` | Schema, policy, and corpus checks on simulator outputs |
| Faithfulness + retrieval trend rollup | `./scripts/ci/Invoke-FaithfulnessTrendReport.ps1` (`-EnforceFaithfulness` optional) | Single Markdown/JSON artifact for assessment and release notes; floor override via `ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO` |
| Deeper RAG quality program (offline) | `python scripts/ci/run_rag_quality_program.py` (`--enforce` optional) | Sequences faithfulness eval, retrieval IR, floor ratchet, and optional rollup — see [`DEEPER_RAG_QUALITY_PROGRAM.md`](DEEPER_RAG_QUALITY_PROGRAM.md) |
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

---

## 9. References

| Document | Purpose |
| --- | --- |
| `docs/quality/RELEASE_CLAIM_GATE.md` | Release claim gate documentation (TB-166) |
| `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` | Template for real-mode run evidence |
| `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` | Golden cohort gate runbook |
| `docs/library/AGENT_OUTPUT_EVALUATION.md` | Agent output evaluation framework |
| [`#buyer-safe-evidence-inventory`](#buyer-safe-evidence-inventory) | Buyer-safe AI evidence index (sponsor packets) |
| `scripts/Invoke-RealLlmEvidenceGate.ps1` | Generates real-mode evidence artifact |
| `scripts/collect-first-pilot-proof.ps1` | Assembles first-pilot proof bundle |
| `PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise` | GTM overclaim guardrails |
