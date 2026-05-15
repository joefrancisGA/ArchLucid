> **Scope:** Living pointer for Terraform Phase **7.5** rename posture and links to archived receipts — not a batch execution checklist; onboarding starts at **[`START_HERE.md`](START_HERE.md)**.

# ArchLucid rename checklist — Phase 7.5 pointer

## Phase 7.5 — Terraform resource addresses (**assessment improvement #1** closed **2026-05-15**)

- **Committed IaC:** All **`infra/**/*.tf`** sources use **`archlucid`** resource labels. Acceptance grep from repo root: **`rg "archiforge" infra --glob "*.tf"`** → **no matches** (see **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`** §Mandatory grep audit).
- **Historical receipts:** Full rename batches (Phases **1–8**) live in **`docs/archive/root-superseded-2026-05-01/ARCHLUCID_RENAME_CHECKLIST.md`** (Phase **7.5** row dated **2026-04-19** — greenfield IaC + removal of temporary **`moved_*.tf`** files).
- **Brownfield remote state:** If **`terraform state list`** still contains **`archiforge`** addresses for an applied stack, operators follow **`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`** and the rehearsal matrix in **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`** (subscriptions **DEV** / **Prod** per **`docs/assessments/LATEST.md`** **P1**).

## Phase 7.6–7.8 — external rename (**assessment improvement #2** closed **2026-04-19**)

- **Receipts:** Full checklist with **7.6** (GitHub **`ArchiForge` → `ArchLucid`**), **7.7** (Entra greenfield alignment in **`infra/terraform-entra/`**), and **7.8** (**waived** — optional local workspace folder rename) lives in **`docs/archive/root-superseded-2026-05-01/ARCHLUCID_RENAME_CHECKLIST.md`** (progress log **2026-04-19** — rename initiative **closed**).
- **Assessment:** **`docs/assessments/LATEST.md`** improvement **#2** and **P2** — owner **IT/security approval** recorded **2026-05-15**; execution for **7.6–7.7** matches the **2026-04-19** archive (not pending scheduling).
