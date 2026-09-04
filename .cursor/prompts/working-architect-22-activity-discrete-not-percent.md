# WA-22 — Activity is discrete state, not a fake percent

**Do not fork RS-05 or LI-08** for findings-not-all-clear while analysis runs or the Overview in-flight desk. This file is **Activity tab copy and any leftover determinate progress UI** that implies a percentage the API does not have.

## Goal

Working-mode Activity (and in-flight chips) show discrete `state` / `stepLabel` already on the operation. No fake `%`. No new `GET /v1/runs/{runId}/progress`. Finalize stays disabled while in-flight. Copy: analysis is running; the package is not ready to seal.

## Why

RS-05 closed Findings empty-as-clean. Activity can still look like a determinate bar (or “almost done”) from wait-copy polls. Casual tools love percent. Livelihoods trust clocks they cannot prove. LRO contract TB-2072 forbids inventing progress URLs.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072)
- `use-shell-in-flight-operations.ts` / `use-run-progress-tracker.ts`
- Review Activity tab
- Recent wait-copy polling (#1448) — keep honest escalation copy; strip any implied percent
- `ReviewWorkspaceStaleBanner` — keep

## What to build

1. Inventory Activity / in-flight UI for `%`, fake determinate bars, or “90%.” Replace with state + stepLabel + elapsed if already available.
2. Vitest: in-flight fixture has no percent string; Findings empty still not all-clear (RS-05).

## Acceptance criteria

- Working user watching Activity cannot screenshot a fake completion percentage.
- They can leave and resume from Overview in-flight (LI-08).
- No call to a non-existent progress URL.

## Constraints

- Do not start `gh pr checks --watch` or a long-lived dev server.
- Do not collapse tabs to “make the queue simpler.”
- Do not implement **M-90**.
