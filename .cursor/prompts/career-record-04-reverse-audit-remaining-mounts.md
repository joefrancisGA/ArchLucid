# CR-04 — Reverse-with-audit leftover mounts (do not lengthen 300s Undo)

**Do not fork IS-12** (working-day reverse-with-audit bet). **Do not fork CD-10 / FD-11** (Record correction mounts). **Do not lengthen** `MUTATION_UNDO_WINDOW_SECONDS`. This file is leftover **registry and copy**: keyboard and bulk finding dispositions are still class `reversible` (five-minute toast), and confirmation leads still describe Record correction as append-only without reversing live state.

## Goal

Working finding dispositions (keyboard, bulk, and the same revisit window already used for deferred findings) stay **reversible_with_audit** after the Undo toast expires: reverse restores prior disposition **and** writes the audit event. Finalize and policy-pack **publish** stay `permanent`. Immediate Undo stays 300 seconds.

## Why

A professional who fat-fingers Accept from the keyboard at 16:00 must reverse it before an ARB at 09:00 without a support ticket. Five minutes of Undo on Alt+1 is casual-SPA. Append-only “I was wrong” while the package still shows Accepted leaves the career artifact lying.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts` — `governance_bulk_disposition` and `governance_keyboard_finding_disposition` are `reversible` with 300s; `FINDING_DISPOSITION_REVISIT_WINDOW_HOURS` is already 24
- `platform_bundled_policy_pack_activate` / `_deactivate` — `amendable: false` (leave unless you find they already reverse in the API; do not invent un-activate without the existing deactivate path)
- `ReversibleMutationSuccessCallout.tsx` / `FindingDispositionRecordCorrectionControl.tsx`
- `mutation-reversibility-mounted-controls.test.ts`
- IS-12 acceptance: mistaken Accept returns to open/needs-evidence after 10 minutes with an audit row

## What to build

1. If IS-12 already flipped those two finding ids to `reversible_with_audit` **and** reverse restores state, this prompt is copy-only: confirmationLead must say reverse restores live disposition, not only “record a correction.”
2. If they are still `reversible`, change classification to `reversible_with_audit`, keep `undoWindowSeconds: 300` for the toast, and wire the same reverse path IS-12 uses for row actions.
3. Vitest: after 10 minutes, keyboard/bulk still offer Reverse / Record correction that restores prior state. Finalize remains unseal-proof.
4. Do not add SoD bypass.

## Acceptance criteria

- Working Alt+1 Accept can be reversed after 10 minutes with an audit row.
- 300s Undo toast still exists.
- Sealed record still cannot be unsealed.
- Pack **publish** stays permanent.

## Constraints

- Do not implement IS-15.
- Do not collapse review tabs.
- No `ConfigureAwait(false)` in tests.
