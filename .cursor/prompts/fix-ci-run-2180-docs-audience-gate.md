# Fix: CI run #2180 — Docs audience gate fails for two library files

**Run:** 27488816955 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Job:** `Docs: NAVIGATOR + connector matrix link targets exist` (databaseId `81250063849`)

## Symptom

`scripts/ci/assert_library_root_audience.py` (TB-013 Phase 2) exits 1:

```
::error::docs/library root markdown audience gate failed:
  - docs/library/HOSTED_PILOT_SINGLE_PATH.md: Scope line lacks audience tagging
    (customer-facing, contributor-reference, contributor, buyer.)
  - docs/library/MINIMUM_VIABLE_PILOT_SUCCESS.md: Scope line lacks audience tagging
    (customer-facing, contributor-reference, contributor, buyer.)
```

## Root cause

The script requires every `docs/library/*.md` file to have a `> **Scope:**` blockquote on its first non-blank line containing at least one of these case-insensitive keywords:

```
customer-facing | contributor-reference | contributor | buyer | evaluator | operator cookbook | moved | compatibility stub
```

In the committed version of these two files the `Scope:` line does not contain any of those tokens.

## Fix

Open each file and ensure the opening scope blockquote includes one of the accepted audience keywords.

**`docs/library/HOSTED_PILOT_SINGLE_PATH.md`** — replace the opening `> **Scope:**` line so it contains `operator cookbook` (or another appropriate keyword). Example — keep the existing narrative and insert the keyword:

```
> **Scope:** Operator cookbook — canonical single-path command sequence for first **hosted pilot** success — one authoritative flow; advanced paths are troubleshooting only.
```

**`docs/library/MINIMUM_VIABLE_PILOT_SUCCESS.md`** — same pattern:

```
> **Scope:** Operator cookbook — shortest path to a **passing baseline** without optional branches (Improvement #8).
```

Check the current first line of each file; if it already contains a qualifying keyword in the local working tree but the committed version differs, confirm the local change is staged and committed.

## Acceptance criteria

1. `python scripts/ci/assert_library_root_audience.py` exits 0 from the repo root.
2. Both files have a `> **Scope:**` blockquote on the first non-blank line containing a recognized audience keyword.
3. No other content changes to these files.

## Verification

```powershell
python scripts/ci/assert_library_root_audience.py
```

## Related

- Script: `scripts/ci/assert_library_root_audience.py`
- Guard runs inside `Docs: NAVIGATOR + connector matrix link targets exist` job in CI.
- Prior audience-gate fix: `.cursor/prompts/fix-ci-run-2152-docs-audience-gate.md`.
