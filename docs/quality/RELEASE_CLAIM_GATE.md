> **Scope:** TB-166 release claim gate — describes the quad-agent real-mode evidence check, output wording rules, manual override procedure, and downstream connections. Does not make live Azure OpenAI calls; that is handled by `scripts/Invoke-RealLlmEvidenceGate.ps1`.

# Release claim gate for real-mode AI evidence

**Last reviewed:** 2026-06-01

**Related:** `scripts/Invoke-ReleaseRealModeClaimGate.ps1`, `scripts/ci/check_release_real_mode_claim.py`, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/library/V1_RELEASE_CHECKLIST.md`.

---

## 1. Purpose

This gate ensures that release packaging, first-pilot proof packets, commercial closeout artifacts, and public claim-boundary materials use the correct wording for the strength of AI evidence attached to the release. It prevents a release from claiming **full quad-agent real-mode AI confidence** when the evidence is missing, partial, stale, or on HOLD.

This is a **release-candidate packaging guard**, not a branch-protection gate. Live Azure OpenAI calls must not run in normal PR CI.

---

## 2. Evidence artifact

The gate requires a `real-llm-evidence-gate.json` (and/or `.md`) artifact in `artifacts/release/`. This artifact is produced by `scripts/Invoke-RealLlmEvidenceGate.ps1`, which runs the Azure OpenAI golden-cohort test suite when credentials are available.

### 2.1 Required fields in `real-llm-evidence-gate.json`

| Field | Required | Notes |
| --- | --- | --- |
| `schema` | Yes | Must be `archlucid.real-llm-evidence-gate.v2` |
| `generatedUtc` | Yes | ISO-8601 timestamp; gate fails if older than 30 days |
| `agentPaths` | Yes | Array of agent path objects; must include Topology, Cost, Compliance, and Critic for full PASS |
| `overallOutcome` | Yes | `PASS`, `WARN`, or `HOLD` |
| `executionMode` | Yes | `real`, `simulator`, `mixed`, or `partial-real` |
| `simulatorOnlyOverride` | Conditional | Required when `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1` is set |

### 2.2 Required agent paths for full PASS

All four agent types must have current passing evidence:

| Agent path | Integer code |
| --- | --- |
| Topology | 1 |
| Cost | 2 |
| Compliance | 3 |
| Critic | 4 |

---

## 3. Gate outcomes and claim wording

The gate outcome determines what wording is permitted in release notes, proof packets, and commercial materials.

| Gate outcome | Evidence state | Permitted claim language |
| --- | --- | --- |
| **PASS** (all four agents, fresh, real mode) | Full quad-agent real-mode evidence, ≤ 30 days old, `overallOutcome = PASS` | "Full real-mode AI evidence: Topology, Cost, Compliance, and Critic agents all passed the real-mode quality gate." |
| **WARN** (partial agents or quality caution) | Some agents passed; at least one is missing, marginal, or topology-only | "Partial real-mode AI evidence. Topology agent: [status]. Cost: [status]. Compliance: [status]. Critic: [status]." |
| **HOLD** (any gate failure) | One or more agents failed the real-mode gate, or semantic/faithfulness below floor | "Real-mode AI quality gate is HOLD. Release claims are limited to simulator-only or partial-real-mode posture." |
| **Missing artifact** | `real-llm-evidence-gate.json` absent or unreadable | "No real-mode AI evidence artifact attached. Release is simulator-only." |
| **Stale artifact** | Gate artifact older than 30 days | "Real-mode AI evidence artifact is stale. Re-run `Invoke-RealLlmEvidenceGate.ps1` before claiming current real-mode status." |
| **Simulator-only override** | `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1` set with documented override | "This release is explicitly simulator-only per [override record]. Real-mode quad-agent evidence is not attached." |

---

## 4. How to run the gate

```powershell
# Standard run — requires artifacts/release/real-llm-evidence-gate.json to exist.
.\scripts\Invoke-ReleaseRealModeClaimGate.ps1

# Require the gate JSON to be present (enforcement mode).
$env:ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE = '1'
.\scripts\Invoke-ReleaseRealModeClaimGate.ps1

# Simulator-only release override (see Section 5 before using).
$env:ARCHLUCID_RELEASE_SIMULATOR_ONLY = '1'
.\scripts\Invoke-ReleaseRealModeClaimGate.ps1
```

To generate the evidence artifact before running the gate:

```powershell
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

This requires `ARCHLUCID_REAL_AOAI_TEST_ENDPOINT` and `ARCHLUCID_REAL_AOAI_TEST_KEY` to be set.

---

## 5. Manual override — simulator-only release

A **simulator-only override** allows a release to proceed without real-mode evidence. This override must be documented before use.

### 5.1 When the override is permitted

- Release is explicitly scoped as simulator-only (e.g., a documentation-only, UI-only, or infrastructure-only release with no new AI paths).
- Real-mode evidence cannot be generated because a deployment is not yet provisioned.
- Owner has explicitly decided to ship a narrower claim for this release.

### 5.2 Override record (required)

Before setting `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1`, create an override record in `artifacts/release/simulator-only-override.md`:

```markdown
# Simulator-only release override

Release: [version or tag]
Date: [YYYY-MM-DD]
Override requested by: [name]
Approved by: [owner name]
Reason: [specific reason — e.g., "no Azure OpenAI deployment provisioned for this environment"]
Claim boundary: [exact wording to use in release notes, e.g., "This release has not been validated against live Azure OpenAI. All agent outputs in this release use simulator-only evidence."]
Revalidation target: [planned date or milestone when real-mode evidence will be regenerated]
```

### 5.3 Downstream wording when override is active

All of the following must use simulator-only language when the override is active:

- Release notes
- First-pilot proof packet (`first-value-report.md`, `go-no-go-summary.md`)
- Commercial closeout state in [`docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`](../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md)
- AI readiness posture artifact (see [`docs/go-to-market/AI_READINESS_POSTURE.md`](../go-to-market/AI_READINESS_POSTURE.md))
- Buyer-facing proof packets

---

## 6. Downstream connections

| Downstream artifact | How gate result feeds it |
| --- | --- |
| Release notes | Gate outcome determines permitted real-mode claim language |
| `first-value-report.md` | AI evidence mode field must match gate outcome |
| `go-no-go-summary.md` | Commercial closeout must not claim full real-mode if gate is WARN/HOLD/missing |
| Commercial conversion checklist | "Procurement posture" row requires gate to be PASS or simulator-only override recorded |
| AI readiness posture artifact | `executionMode` per agent path is sourced from gate JSON (TB-167) |
| Sponsor proof ZIP | Must include gate artifact or explicit simulator-only override record |
| Public claim-boundary check | `scripts/Scan-BuyerDocClaims.ps1` consults gate outcome |

---

## 7. Validation matrix (for fixture tests)

Tests covering the gate logic live in the CI Python test suite. The following scenarios must be covered:

| Scenario | Expected outcome |
| --- | --- |
| All four agent paths present, fresh, real mode, `overallOutcome = PASS` | Gate PASS — full real-mode claim permitted |
| Topology only (Cost/Compliance/Critic missing) | Gate WARN — topology-only claim language required |
| Three of four agents passing | Gate WARN — partial-agent language required |
| Gate JSON stale (> 30 days) | Gate FAIL — stale artifact language required |
| Gate JSON absent | Gate FAIL — no-evidence language required |
| `overallOutcome = HOLD` in gate JSON | Gate HOLD — HOLD language required |
| `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1` with override record | Override accepted — simulator-only language applied |
| `ARCHLUCID_RELEASE_SIMULATOR_ONLY=1` without override record | Override rejected — missing override record error |

---

## 8. References

| Resource | Purpose |
| --- | --- |
| `scripts/Invoke-ReleaseRealModeClaimGate.ps1` | PowerShell wrapper for the gate check |
| `scripts/ci/check_release_real_mode_claim.py` | Core gate logic (Python) |
| `scripts/Invoke-RealLlmEvidenceGate.ps1` | Generates the evidence artifact via live AOAI |
| `scripts/Invoke-ReleaseRealLlmEvidenceRequirement.ps1` | Enforces evidence requirement for reference-cohort releases |
| `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` | Golden cohort gate runbook |
| `docs/quality/REAL_LLM_SESSION_2026-05-29.md` | Example real-mode evidence session |
| `docs/library/V1_RELEASE_CHECKLIST.md` | Full V1 release checklist |
| `docs/go-to-market/AI_READINESS_POSTURE.md` | Sponsor AI readiness posture artifact (TB-167) |
| `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` | GTM overclaim guardrails |
