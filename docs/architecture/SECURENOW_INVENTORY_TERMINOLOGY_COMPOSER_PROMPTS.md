> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that replace bare **snapshot** / **Snapshot A|B** buyer copy on SecureNow infrastructure-evidence surfaces with **Azure inventory** terminology. Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Hold:** [`../library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md`](../library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md).
> **Paste files:** [`.cursor/prompts/securenow-inventory-terminology-00-index.md`](../../.cursor/prompts/securenow-inventory-terminology-00-index.md) (one numbered file per session).

# SN-IT-01–SN-IT-06 — SecureNow Azure inventory terminology

**Observed:** SecureNow infrastructure UI mixes **inventory snapshots**, **Current snapshot**, **From snapshot**, **To snapshot**, **Compare snapshots**, and nav **Drift & snapshots** with the plane’s buyer intent: one **Azure inventory** observation spine (`AzureInventorySnapshot`). Bare **snapshot** collides with sealed review / golden manifest / **assessment snapshot** (`AuditEvidenceSnapshot`) and reads like internal engineering on procurement walkthroughs.

**Product framing (locked):**

| Buyer concept | Preferred SecureNow label | Keep internal / API |
|---------------|---------------------------|-------------------|
| Point-in-time Azure inventory materialization | **Azure inventory capture** or **inventory capture** | `AzureInventorySnapshot`, `snapshotId` |
| Compare pair (diff baseline vs current) | **Baseline capture** / **Compare capture** (or **earlier** / **later capture**) | `snapshotAId`, `snapshotBId` |
| Drift workbench nav | **Drift & Azure inventory** | route `/governance/infrastructure/drift` unchanged |
| ARC-AMPE / audit export lineage | **assessment snapshot** (only in audit-evidence context) | `AuditEvidenceSnapshot` |
| Architecture sealed review | unchanged **review** / **golden manifest** language | Architecture shell only |

Do **not** rename REST paths, SQL, or C# types in this wave.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| No locked glossary or helper | **SN-IT-01** | Each page invents different strings |
| Drift nav + pickers still say snapshot | **SN-IT-02** | **Drift & snapshots**; Snapshot A/B mental model |
| Hub / explorer / diagrams / reconcile / upload | **SN-IT-03** | “inventory snapshots” without Azure inventory lead |
| Architect metrics compare controls | **SN-IT-04** | From/To snapshot; Compare snapshots |
| Help drawers still teach snapshot compare | **SN-IT-05** | SH-26 partial fix only |
| Regressions without CI | **SN-IT-06** | Bare snapshot returns on next copy edit |
| Rename APIs / types / Architecture copy | **SN-IT-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-IT-01** Glossary + helper | **First** | TB-645 sentence case |
| **SN-IT-02** Drift workbench + nav | After 01 | IE-UX drift route exists |
| **SN-IT-03** Infrastructure spine modules | After 01 | `securenow-infrastructure-*-copy.ts` |
| **SN-IT-04** Architect metrics + honesty | After 01 | SA-11 UI |
| **SN-IT-05** Help job-match | After 01; parallel with 02–04 | SH-01 resolver if needed |
| **SN-IT-06** CI ratchet | After 02–05 preferred | SN-07 allowlist pattern |
| **SN-IT-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/sn-it-<short-name>-c14a`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply`. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- **Security shell only** for buyer copy unless the prompt names a shared module that must branch on `NEXT_PUBLIC_ARCHLUCID_PRODUCT`.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer copy modules over JSX literals. Sentence case. **TB-2005** / **TB-645**. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**

### Locked replacements (do not re-litigate in implementation chats)

- Nav `infrastructureDrift`: **Drift & Azure inventory** (not **Drift & snapshots**).
- Drift pickers: **Baseline capture** / **Compare capture** (not **Current snapshot** / **Diff vs other snapshot**).
- Architect metrics: **From capture** / **To capture** / **Compare captures** (not **From snapshot** / **To snapshot** / **Compare snapshots**).
- Empty states: **after an Azure inventory capture exists** (not **after a snapshot**).
- Never show **Snapshot A** or **Snapshot B** in buyer-visible labels; use capture + timestamp/subscription context instead.

---

# SN-IT-01 — Glossary row + copy helper

**Depends on:** none · **Branch:** `cursor/sn-it-glossary-helper-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-01-glossary-helper.md`](../../.cursor/prompts/securenow-inventory-terminology-01-glossary-helper.md)

# SN-IT-02 — Drift workbench + navigation

**Depends on:** SN-IT-01 · **Branch:** `cursor/sn-it-drift-workbench-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-02-drift-workbench.md`](../../.cursor/prompts/securenow-inventory-terminology-02-drift-workbench.md)

# SN-IT-03 — Infrastructure spine copy modules

**Depends on:** SN-IT-01 · **Branch:** `cursor/sn-it-infrastructure-spine-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-03-infrastructure-spine.md`](../../.cursor/prompts/securenow-inventory-terminology-03-infrastructure-spine.md)

# SN-IT-04 — Architect metrics + honesty verify hints

**Depends on:** SN-IT-01 · **Branch:** `cursor/sn-it-architect-metrics-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-04-architect-metrics.md`](../../.cursor/prompts/securenow-inventory-terminology-04-architect-metrics.md)

# SN-IT-05 — Help + Category-1 job-match

**Depends on:** SN-IT-01 · **Branch:** `cursor/sn-it-help-job-match-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-05-help-job-match.md`](../../.cursor/prompts/securenow-inventory-terminology-05-help-job-match.md)

# SN-IT-06 — Security-shell terminology ratchet

**Depends on:** SN-IT-02–05 preferred · **Branch:** `cursor/sn-it-terminology-ratchet-c14a`

**Paste file:** [`.cursor/prompts/securenow-inventory-terminology-06-ci-ratchet.md`](../../.cursor/prompts/securenow-inventory-terminology-06-ci-ratchet.md)

# SN-IT-HOLD — Identifier and Architecture copy hold

**Not implementation.** Paste file: [`.cursor/prompts/securenow-inventory-terminology-07-hold.md`](../../.cursor/prompts/securenow-inventory-terminology-07-hold.md)
