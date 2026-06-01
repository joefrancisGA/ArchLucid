> **Scope:** TB-167 — Sponsor AI readiness posture artifact. Composes execution mode, quality-gate results, retrieval posture, and budget posture into one sponsor-safe summary. This document describes the artifact schema and how to produce it; the actual per-release artifact lives in `artifacts/release/ai-readiness-posture.md` (and `.json`).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# AI readiness posture artifact

**Audience:** Pilot sponsors, executive buyers, and proof-packet reviewers who need a single artifact summarizing ArchLucid's AI evidence quality, retrieval posture, and budget posture without reading multiple technical evidence files.

**Last reviewed:** 2026-06-01

**Related:** [`AI_EVIDENCE_APPENDIX.md`](AI_EVIDENCE_APPENDIX.md), `docs/quality/RELEASE_CLAIM_GATE.md`, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `scripts/collect-first-pilot-proof.ps1`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`.

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
# (Script: scripts/Write-AiReadinessPosture.ps1 — see Section 5.3 for status)

# Step 3: Include artifact in first-pilot proof bundle.
.\scripts\collect-first-pilot-proof.ps1
```

### 5.2 Manual path (when automated script is not yet available)

1. Fill in `ai-readiness-posture.json` using the schema in Section 2.
2. Source execution mode from `artifacts/release/real-llm-evidence-gate.json` or operator knowledge.
3. Source quality gate outcome from `artifacts/release/real-llm-evidence-gate.json`.
4. Source retrieval posture from `docs/quality/retrieval-ir-report.md` or operator knowledge.
5. Source budget posture from `artifacts/release/real-llm-cost-rollup.json` or operator knowledge.
6. Write the sponsor-safe summary paragraph following Section 3 rules.
7. Place artifact at `artifacts/release/ai-readiness-posture.json` and `artifacts/release/ai-readiness-posture.md`.

### 5.3 Script status

`scripts/Write-AiReadinessPosture.ps1` is planned for V1.1. For V1 pilots, use the manual path above. The schema is stable; the automation assembles the same fields.

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

## 8. References

| Document | Purpose |
| --- | --- |
| `docs/quality/RELEASE_CLAIM_GATE.md` | Release claim gate documentation (TB-166) |
| `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` | Template for real-mode run evidence |
| `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` | Golden cohort gate runbook |
| `docs/library/AGENT_OUTPUT_EVALUATION.md` | Agent output evaluation framework |
| `AI_EVIDENCE_APPENDIX.md` | AI evidence appendix for sponsor packets |
| `scripts/Invoke-RealLlmEvidenceGate.ps1` | Generates real-mode evidence artifact |
| `scripts/collect-first-pilot-proof.ps1` | Assembles first-pilot proof bundle |
| `WHAT_NOT_TO_PROMISE.md` | GTM overclaim guardrails |
