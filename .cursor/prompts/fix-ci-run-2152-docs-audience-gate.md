# Fix: CI #2152 — docs/library audience gate fails on `operator-shell.md`

**Run:** 27395468550 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Commit:** `e5910318a`
**Job:** `Docs: NAVIGATOR + connector matrix link targets exist`

## Symptom

```
##[error]docs/library root markdown audience gate failed:
  - docs/library/operator-shell.md: Scope line lacks audience tagging (customer-facing, contributor-reference, contributor, buyer.)
##[error]Process completed with exit code 1.
```

## Root cause

`scripts/ci/assert_library_root_audience.py` requires the first `> **Scope:**` blockquote line of
every `docs/library/*.md` file to contain one of these audience keywords:

```
customer-facing, contributor-reference, contributor, buyer,
evaluator, operator cookbook, moved, compatibility stub
```

Commit `378e76ee8` reworded `docs/library/operator-shell.md`. Its current Scope line (line 1) has
**no** audience keyword:

```markdown
> **Scope:** Operator workflow — UI routes, API seams, and progressive Pilot vs Operate disclosure.
```

The doc's stated audience (line 8) is "Internal operators and design partners … maintaining the
operator UI" — i.e. contributors. Sibling library docs (e.g. `EXECUTIVE_SHELL.md`) tag the Scope
line with "contributors".

## Fix

Edit `docs/library/operator-shell.md` line 1 so the Scope line includes the `contributor` keyword,
matching the convention used by `EXECUTIVE_SHELL.md`:

```markdown
> **Scope:** Operator workflow — UI routes, API seams, and progressive Pilot vs Operate disclosure; audience is contributors maintaining the operator UI, not a buyer-facing document.
```

Do not change the `**Audience:**` body line (line 8) or any other content.

## Verify

Run the gate locally:

```powershell
python scripts/ci/assert_library_root_audience.py
```

Expected: `[audience-gate] OK — <N> root library markdown file(s) tagged.` and exit code 0.
