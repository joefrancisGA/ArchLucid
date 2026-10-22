# Buyer-polished operator shell forks

`isBuyerPolishedOperatorShellEnv()` gates buyer-facing copy, density, and navigation affordances in the operator UI. Each call site is a **fork** that must stay aligned with procurement demos and pilot polish expectations.

## Why we inventory forks

- **Discoverability:** engineers can see every production branch without ripgrep archaeology.
- **Ratchet:** `scripts/ci/check_buyer_polished_shell_forks.py` fails CI when a new fork is added without updating the manifest.
- **Consolidation backlog:** the manifest is the input list for future TB work to collapse forks behind a single shell contract.

## Canonical manifest

[`buyer-polished-shell-forks.manifest.txt`](./buyer-polished-shell-forks.manifest.txt) — one repo-relative path per line (POSIX slashes).

Excluded from the manifest (by design):

- `*.test.ts` / `*.test.tsx` and `*.buyer-polished.test.tsx`
- `archlucid-ui/src/lib/demo-ui-env.ts` (definition)
- `archlucid-ui/src/testing/buyer-polished-shell-vitest-override.ts` (test harness)

## Adding a fork

1. Call `isBuyerPolishedOperatorShellEnv()` only when buyer polish genuinely differs from full operator shell behavior.
2. Append the file path to `buyer-polished-shell-forks.manifest.txt` (sorted).
3. Run `python scripts/ci/check_buyer_polished_shell_forks.py` locally.

## Related backlog

Principal architect critique round 3 tracked consolidation follow-ups under **TB-2042**–**TB-2047** in [`docs/library/TECH_BACKLOG_OPEN.md`](../library/TECH_BACKLOG_OPEN.md).
