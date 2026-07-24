> **Scope:** Operator runbook — misconfiguration risks under Core Pilot cognitive load (SAQ-012). UI/API detection and recovery; not a substitute for tenant isolation ADR 0037 review.

# Pilot misconfiguration guards

**Audience:** Pilot operators, sales engineers, support.  
**Last reviewed:** 2026-06-17

**Related:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md) · [`TENANT_DATABASE_TOPOLOGY.md`](../library/TENANT_DATABASE_TOPOLOGY.md) · [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md)

---

## Matrix

| Misconfiguration | Detection | User-visible warning | Recovery |
| --- | --- | --- | --- |
| **SingleCatalog on hosted/production-like profile** | `archlucid config check` or startup `ProductionSafetyRules`; API logs on boot | Trust/onboarding docs — **not** a safe multitenant posture for hosted SaaS | Set `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`; reprovision tenant catalog per [`TENANT_DATABASE_TOPOLOGY.md`](../library/TENANT_DATABASE_TOPOLOGY.md) |
| **Simulator + Real mixed in one sponsor workflow** | Review detail `structuralExecutionMode=Mixed`; sponsor banner execution-mode badge | `EmailRunToSponsorBanner` **Execution mode blocks external sponsor PDF** alert (`data-testid=email-run-to-sponsor-execution-mode-gap`) | Re-run review on Real mode or keep exports internal-only with explicit simulator labels |
| **Real mode fell back to simulator** | `pilot-run-deltas.realModeFellBackToSimulator=true`; first-screen proof HOLD | Run detail proof strip + sponsor banner HOLD copy | Fix AOAI config; re-execute; do not forward sponsor PDF until Real |
| **Skipping evidence upload before execute** | Home readiness cockpit WARN; empty graph/context | Operator Home **First-pilot operating path** step 2 incomplete | Upload extractor ZIP or attach sample package; acknowledge evidence |
| **Sponsor send before commit** | No manifest on review detail; sponsor banner absent | Finalize step incomplete on Home checklist | Execute → **Finalize / commit** golden manifest first |
| **PilotStrict HOLD ignored** | `agentOutputPilotStrictEvidenceSatisfied=false` | Sponsor PDF + **Mark as sent** disabled; AI readiness alert | Open first-value report; resolve faithfulness/citation gaps; re-run if needed |
| **Unsourced ROI dollar claims** | `projectedDollarClaimsSponsorSafe=false` | Projected-dollar / ROI baseline alerts on sponsor banner | Capture baselines on `/settings/baseline` or `/scorecard#roi-baselines` |
| **Dual run lifecycle confusion** | Operator uses legacy coordinator execute on authority-pipeline run (or vice versa) | Pipeline timeline vs agent-task UI mismatch | Inspect `GET /v1/architecture/run/{runId}`; pick **one** model per run per [`ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md) Flow A0 |

---

## Pre-finalize nav guard (UI)

Before the tenant's first finalized review (`hasCommittedArchitectureReview=false`), the architect workspace narrows sidebar links via `nav-committed-architecture-review-gate.ts`:

- **Allowed:** Home, Start review, Architecture packages, Evidence graph, Portfolio overview, Onboarding, Help, ROI baselines (`/settings/baseline`).
- **Hidden:** Operate analysis/governance clusters until first finalize **or** explicit **Show all features** (`data-testid=nav-advanced-unlock`).

Deep links to hidden routes remain valid; API authorization unchanged.

---

## Verification commands

```powershell
# Config posture (topology, execution mode hints)
archlucid config check

# End-to-end proof with HOLD fail-fast
.\scripts\collect-first-pilot-proof.ps1 -RunId '<committed-run-id>' -SponsorHandoff -FailOnHold
```

---

## SAQ-012 disposition

Documented matrix satisfies SAQ-012 for V1 RC: cognitive-load misconfiguration is **detected and labeled**; remaining risk is operator discipline on deep links — not silent data corruption.
