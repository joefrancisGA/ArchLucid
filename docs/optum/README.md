> **Reviewed:** 2026-09-15
>
> **Scope:** Optum management engagement — SecureNow / infrastructure-evidence pilot planning, weekly milestones, and feature scope proposals. Not a customer contract, procurement attestation, or published reference.

# Optum — engagement index

**Audience:** Francis Architecture LLC delivery owner, Optum management sponsors, and engineering agents scoping SecureNow work.

**Last reviewed:** 2026-09-15

**Product line:** [SecureNow](../library/SECURENOW_ARCHITECT_PLANE.md) over the shared [infrastructure-evidence plane](../library/INFRA_EVIDENCE_PLANE.md) (one Azure collector → snapshot → drift, diagrams, reconciliation, remediation, ARC-AMPE selectors).

---

## Strategic arc

| Phase | Intent | Status (2026-09-15) |
| --- | --- | --- |
| **1 — Security remediation factory** | Operational finding stream, advisory remediation, verify on next snapshot | Partially built; SecureNow architect engines and remediation factory UI exist; `SA-22` hold — no apply engine |
| **2 — ARC-AMPE compliance factory** | Audit evidence selectors over inventory snapshot; policy pack #24 content shipped | Pack content **Done** (GTM **M-35**); audit evidence plane prompts **AE-01–AE-10** partially open |
| **Prerequisite — accurate records** | Inventory and diagrams that match reality before security/compliance conclusions are credible | **In progress** — weeks 1–2 delivered; week 3 targets diagram import vs inventory comparison |

Optum management challenged delivery to prove BI/automation value in two steps: **week 1 — Azure inventory**, **week 2 — diagrams from inventory**. They are anxious to **import existing diagrams**, **compare against reality**, and **surface differences** before advancing to security and compliance features. Optum lacks a strong internal architecture function; this engagement is also a path to **correct their records**.

---

## Weekly milestones

| Week | Buyer-visible outcome | Primary surfaces |
| --- | --- | --- |
| **1** | Azure inventory captured and materialized as point-in-time snapshots | Extract & upload, hosted auto-pull, resource explorer |
| **2** | Diagrams generated from inventory (Mermaid modes, PNG export, large-subscription collapse) | `/infrastructure/diagrams`, `/governance/infrastructure/diagrams` |
| **3** | **Documentation accuracy pass** — import their diagrams, reconcile vs snapshot, scorecard + exportable difference report | See [WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md](WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md) |
| **4+** | Transition into remediation factory using reconciliation findings; ARC-AMPE compliance posture | Remediation factory, audit evidence lineage |

---

## Documents in this folder

| Document | Purpose |
| --- | --- |
| [WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md](WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md) | Proposed week-3 feature goals, sequencing, scope boundaries, and demo risks |

---

## Related repo contracts

- Infrastructure-evidence plane: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md)
- SecureNow architect plane: [`docs/library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md)
- Diagram ↔ inventory reconciliation (IE-19): [`DiagramInfrastructureMatcher`](../../ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureMatcher.cs), workbench at `/governance/infrastructure/diagram-reconcile`
- Honesty / no-apply constraints: [`docs/library/SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md)
- Structured diagram intake MIME allowlist: [`SupportedContextDocumentContentTypes`](../../ArchLucid.ContextIngestion/SupportedContextDocumentContentTypes.cs)
