# CA-43 — CLI list/get architectures

**Do not** make `archlucid drafts` print as architectures. **Do not** implement BFF. HTTP CA-11 must exist.

## Goal

CLI can list and show the customer object:

1. `archlucid architectures list` (or `archlucid architecture list`) — scoped, table of id / name / updated / child counts.
2. `archlucid architectures get <architectureId>` — identity + child summaries.
3. Help text: Architecture ≠ draft ≠ review.

## Why

Repeat professionals use CLI in the same seat motion as the desk. If CLI only has runs, the noun is still a pipeline.

## Context

- `docs/library/CLI_USAGE.md`
- Existing drafts/runs commands
- CA-11 routes

## What to build

1. Commands + tests (scope miss, two identities).
2. Docs row in CLI_USAGE.
3. Do not add delete (CA-49 is soft-archive via API if you get there first — CLI archive can wait for CA-49).

## Acceptance criteria

- List does not print draft ids in the architecture id column.
- Unauthenticated / wrong tenant fails closed.

## Constraints

- Preserve CLI Bearer (LK-05 constraint).
- No full-solution build; scoped compile on Cli + tests.
