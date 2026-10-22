> **Scope:** Contributor-reference — copy-paste Composer prompts that stop SecureNow `/compliance/findings` from rendering the ArchLucid Working architecture findings desk. **Prompts only** — do not implement from this file.
> **Paste files:** [`.cursor/prompts/securenow-findings-queue-00-index.md`](../../.cursor/prompts/securenow-findings-queue-00-index.md).

# SN-FQ-01–SN-FQ-04 — SecureNow findings queue is not an architecture desk

**Observed (2026-09-24):** `http://localhost:3001/compliance/findings?architectureId=customer-intake` on the SecureNow shell shows ArchLucid Working-inhabit chrome: title **Architecture**, “Afternoon document for this architecture…”, “You inhabit this architecture on the desk…”, architecture risk-register layer guidance, a seal-delta 404, and **Open architecture desk**.

**Cause:** `/compliance/findings` mounts `GovernanceFindingsQueueClient`. Working mode rewrites the URL with the last-open architecture id (`customer-intake` is the ArchLucid sample slug, not a GUID). Any non-empty `architectureId` turns on IH-016 inhabit presentation, which calls `GET /v1/architectures/{id}/seal-delta`. That route is `{architectureId:guid}`, so the slug 404s. An empty risk register then falls through to ArchLucid `listRunsByProjectPaged("default")`, and the failure is painted as live Working recovery.

**Product framing (locked):**

| Surface | SecureNow | ArchLucid |
|---------|-----------|-----------|
| Findings route | `/compliance/findings` | `/governance/findings` and `/architecture/architectures/{id}/findings` |
| Page identity | **Findings** — ARC-AMPE and cloud-inventory findings | Architecture H1 on the nested findings document only |
| Desk continuity `architectureId` | Do not read, write, or inhabit from it | Unchanged |
| Seal delta / architecture desk CTA | Do not call or link | Nested findings document only |
| Empty register | Successful empty queue | Existing register-then-review fallback stays |

Do **not** change the seal-delta route to accept slugs. Do **not** remove IH-016 from the Architecture nested findings document.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Working mode + `architectureId` inhabits SecureNow | **SN-FQ-01** | Title **Architecture**, inhabit sentences, seal-delta 404, **Open architecture desk** |
| Layer header and claim still say architecture reviews | **SN-FQ-02** | “Track architecture risks…”, approval-controls sentence about architecture reviews |
| Empty register falls through to authority reviews | **SN-FQ-03** | **Findings load failed** / Working recovery on a legitimately empty SecureNow queue |
| No regression lock | **SN-FQ-04** | Next copy edit puts the desk back on `/compliance/findings` |
| Change seal-delta to accept slugs, or delete IH-016 | **SN-FQ-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-FQ-01** Stop inhabit, desk rewrite, seal-delta, desk CTA on Security | **First** | — |
| **SN-FQ-02** Security findings voice on the shared header | After 01 | Existing `SECURENOW_FINDINGS_HELP_*` and `SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE` |
| **SN-FQ-03** Empty Security register is empty | After 01 | — |
| **SN-FQ-04** Screenshot ratchet | After 01–03 | — |
| **SN-FQ-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/sn-fq-<short-name>`). Name the branch in any commit or push request.

## Shared constraints (every prompt)

- Security shell only (`productLine === "security"`, route `/compliance/findings`) unless the prompt names a shared function that must branch.
- Leave Architecture nested findings (`/architecture/architectures/{architectureId}/findings`) on the IH-016 document. Leave `/governance/findings` desk continuity alone.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Sentence case. **TB-645**. Visible-boundary buttons. No ghost or link button variants.
- Stage only this prompt’s paths. **No `git add -A`.**
- Focused Vitest from `archlucid-ui/`. No full-solution build. No dev server unless the prompt says so.
