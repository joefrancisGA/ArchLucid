> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that restore the **Drift & snapshots** change table after perf wave 8 put `content-visibility: auto` on every `EnterpriseTable` row. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/drift-table-layout-00-index.md`](../../.cursor/prompts/drift-table-layout-00-index.md) (one numbered file per session).
>
> **This PR is prompts only — do not implement IE-DT-01–04 from the prompt-set PR.**

# IE-DT-01–IE-DT-04 — Drift workbench table is overlapping microscopic text

**Observed:** `/governance/infrastructure/drift` (**Drift & snapshots**), owner screenshot 2026-09-13. Title, lead, snapshot/diff pickers, filters, and export remain readable. The **Inventory drift changes** `EnterpriseTable` is a tall wall of overlapping microscopic text — not discrete Carbon rows. Column headers (Resource, Resource group, Resource type, Change, Property, Risk) are barely scanable.

**Product framing (locked):** IE-UX-01 workbench already exists. This is a **layout regression** on the shared table token, not a missing API. Do not “fix” by hiding columns, shrinking type below 13px, or dropping `CHANGES_PAGE_SIZE`.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| `content-visibility: auto` on `<tr>` | **IE-DT-01** | Column measure stays skipped; every `EnterpriseTable` can paint overlapping 1-character wrap |
| Density after boxes exist | **IE-DT-02** | 100 rows lose the header; long names `break-all`; tags clip |
| Token can be re-copied | **IE-DT-03** | Next INP pass restores perf wave 8 on `table.row` |
| No browser proof | **IE-DT-04** | jsdom stays green while Chromium overlaps again |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|----------|------------|
| **IE-DT-01** Remove `content-visibility` from table rows | First | none |
| **IE-DT-02** Readable density + sticky header | After 01 | IE-DT-01 |
| **IE-DT-03** Token + CSS source ratchet | After 01 | IE-DT-01 (parallel with 02) |
| **IE-DT-04** Playwright overlap ratchet | Last | IE-DT-01, IE-DT-02 |

**Run one prompt per chat.** Feature branch per prompt (`cursor/drift-table-layout-<short-name>-ce93`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Keep `EnterpriseTable` + `StatusTag` / `SeverityTag`. Do not invent a second table dialect. Do not put `content-visibility` back on `display: table-row`.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Owner screenshot: pickers OK, table corrupted. Not a zoom-only artifact of the capture.
- `DESIGN_TOKENS.table.row` currently includes `content-visibility-auto`.
- `globals.css` `.content-visibility-auto { content-visibility: auto; contain-intrinsic-size: auto 48px; }` — comment names EnterpriseTable rows (perf wave 8).
- `content-visibility` / CSS containment skips layout of descendants. For `table-row` Chromium does not keep the table width algorithm. Cells paint anyway → 1-character columns + overlapping Y.
- `contain-intrinsic-size: auto 48px` does not restore column measure.
- Drift `CHANGES_PAGE_SIZE = 100` makes this the loudest surface; Reviews / findings / audit share the token.
- React compiler memoization in `next.config.ts` is unrelated. Do not disable it in this wave.

---

# IE-DT-01 — Remove `content-visibility` from EnterpriseTable rows

**Depends on:** none · **Branch:** `cursor/drift-table-layout-remove-content-visibility-ce93`

**Paste file:** [`.cursor/prompts/drift-table-layout-01-remove-content-visibility-from-table-rows.md`](../../.cursor/prompts/drift-table-layout-01-remove-content-visibility-from-table-rows.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: EnterpriseTable rows must participate in CSS table layout again. Remove content-visibility from table-row. Do not fork a new table component.

Owner screenshot (do not re-diagnose): /governance/infrastructure/drift, 2026-09-13. Snapshot pickers readable. Change table is overlapping microscopic text.

This is NOT IE-UX-01, IDS, IDT, IDH, or IDG. Do not hide desktop review workspace tabs. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.

Read first:
- .cursor/prompts/drift-table-layout-00-index.md
- .cursor/prompts/drift-table-layout-01-remove-content-visibility-from-table-rows.md
- archlucid-ui/src/lib/design-tokens-shell-chrome.ts (DESIGN_TOKENS.table.row)
- archlucid-ui/src/app/globals.css (.content-visibility-auto)
- archlucid-ui/src/components/ui/enterprise-table.tsx

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'

Work: implement only "What to build" in the paste file.

Compile/test: cd archlucid-ui && npx vitest run src/components/ui/enterprise-table.test.tsx
Done when: DESIGN_TOKENS.table.row has no content-visibility; rendered <tr> is not content-visibility-auto; table role tests still pass.
```

---

# IE-DT-02 — Restore readable drift-table row density

**Depends on:** IE-DT-01 · **Branch:** `cursor/drift-table-layout-readable-density-ce93`

**Paste file:** [`.cursor/prompts/drift-table-layout-02-restore-readable-row-density.md`](../../.cursor/prompts/drift-table-layout-02-restore-readable-row-density.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: after IE-DT-01 restores row boxes, the drift change table must be a Carbon inventory — 13px type, tags in-cell, sticky header on 100 rows. Do not put content-visibility back.

Owner screenshot leftover (do not re-diagnose): even if overlap is gone, 100 rows + long resource names + StatusTag must stay readable.

Read first:
- .cursor/prompts/drift-table-layout-00-index.md
- .cursor/prompts/drift-table-layout-02-restore-readable-row-density.md
- DriftWorkbenchClient.tsx, DriftChangeResourceCell.tsx, DESIGN_TOKENS.table

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file. If IE-DT-01 is not in the tree, stop.

Verification: cd archlucid-ui && npx vitest run src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.test.tsx src/components/ui/enterprise-table.test.tsx
Done when: mocked drift table shows discrete rows, 13px cells, Change/Risk tags, sticky or documented header.
```

---

# IE-DT-03 — Token ratchet against table-row `content-visibility`

**Depends on:** IE-DT-01 · **Branch:** `cursor/drift-table-layout-token-ratchet-ce93`

**Paste file:** [`.cursor/prompts/drift-table-layout-03-token-ratchet.md`](../../.cursor/prompts/drift-table-layout-03-token-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: CI must fail if content-visibility is copied back onto DESIGN_TOKENS.table.row or enterprise-table.tsx. Optional: drift-table-layout prompt inventory vitest.

Read first:
- .cursor/prompts/drift-table-layout-00-index.md
- .cursor/prompts/drift-table-layout-03-token-ratchet.md
- archlucid-ui/src/lib/desk-ia-prompt-inventory.test.ts (inventory pattern)

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Verification: focused vitest named in the paste file.
Done when: adding content-visibility-auto to table.row fails the new test.
```

---

# IE-DT-04 — Playwright overlap ratchet on the drift table

**Depends on:** IE-DT-01, IE-DT-02 · **Branch:** `cursor/drift-table-layout-overlap-ratchet-ce93`

**Paste file:** [`.cursor/prompts/drift-table-layout-04-drift-workbench-overlap-ratchet.md`](../../.cursor/prompts/drift-table-layout-04-drift-workbench-overlap-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: mock Playwright must fail if drift change rows overlap or type drops below 13px — the owner screenshot shape.

Read first:
- .cursor/prompts/drift-table-layout-00-index.md
- .cursor/prompts/drift-table-layout-04-drift-workbench-overlap-ratchet.md
- archlucid-ui/e2e/infra-evidence-hub-handoff.mock.spec.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Verification: scoped Playwright mock file only. Heartbeat STILL EXECUTING... HH:mm:ss every 8s if >15s.
Done when: ≥8 body rows, non-overlapping bounding boxes, fontSize ≥ 13, first cell clientWidth ≥ 80. Probe that reverting IE-DT-01 fails the spec, then restore 01.
```
