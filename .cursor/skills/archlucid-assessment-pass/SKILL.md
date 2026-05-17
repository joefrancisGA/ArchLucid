---
name: archlucid-assessment-pass
description: >-
  Runs ArchLucid weighted readiness / first-principles assessment workflow:
  canonical doc reads, (A)/(B) boundary, single output file. Use when updating
  readiness scores, overwriting docs/assessments/LATEST.md, executive or V1.1
  assessment passes, procurement realism vs headline gates, or following
  ASSESSMENT_INPUTS.md order.
disable-model-invocation: true
---

# ArchLucid assessment pass

## When to use

- User asks for a **weighted readiness**, **first-principles**, **trust + product composite**, or **broad repo** assessment (not a narrow bugfix).
- Work must **update** [`docs/assessments/LATEST.md`](../../../docs/assessments/LATEST.md) as the **single current** score + backlog.

## Preconditions

- Load scoring rules from [`.cursor/rules/Assessment-Scope-V1_1.mdc`](../../../.cursor/rules/Assessment-Scope-V1_1.mdc) (**not** always injected). In Cursor: `@Assessment-Scope-V1_1` or read the file.
- Follow [`.cursor/rules/Assessment-Read-First.mdc`](../../../.cursor/rules/Assessment-Read-First.mdc) (output discipline).

## Workflow (strict order)

1. **Skim** [`docs/library/REPO_DIGEST.md`](../../../docs/library/REPO_DIGEST.md) for inventory anchors (regenerate if tree changed: `python scripts/repo_digest/build_repo_digest.py`).
2. **Read** [`docs/library/ASSESSMENT_INPUTS.md`](../../../docs/library/ASSESSMENT_INPUTS.md) fully — especially **“One workflow (current score vs history)”** and the **ordered table** (evaluation contract).
3. **Apply** `(A)` headline V1 readiness vs `(B)` procurement / informational realism per `Assessment-Scope-V1_1.mdc` and the standing boundary bullets already in [`docs/assessments/LATEST.md`](../../../docs/assessments/LATEST.md).
4. **Canonical score:** only **`docs/assessments/LATEST.md`** — do **not** cite `docs/archive/assessments/` as today’s headline number.
5. **Before overwrite:** optionally copy current `LATEST.md` to `docs/archive/assessments/` with a **dated** filename (see `ASSESSMENT_INPUTS.md`).
6. **Write** the new pass by **overwriting** `docs/assessments/LATEST.md`. Do not add new giant dated assessment files under `docs/library/` unless the team explicitly opts in — archive instead.
7. **Targeted evidence:** after the doc pass, open **specific** code/docs for claims (controllers, orchestrators, ADRs), not whole-tree listing.
8. **GA / shipping tasks:** if **`docs/archive/agent-prompts/CURSOR_PROMPTS_GA_TASK*.md`** applies to the improvement, use that file as the **sequenced prompt source**; still align closure notes back into `LATEST.md` when done.

## Optional math check

[`scripts/calculate_scores.py`](../../../scripts/calculate_scores.py) holds a **hardcoded** `qualities` dict; it is **not** generated from `LATEST.md`. Use it only if the team updates that dict to mirror dimension scores and wants a quick weighted rollup printout — otherwise derive narrative and numbers in `LATEST.md` from the rubric.

## Do not

- Treat archived assessments or `docs/archive/quality/` as mandatory unless the user asks for **historical comparison**.
- Mix procurement-only friction into `(A)` headline gates when the rubric says `(B)` (see scope rule).

## See also

- [reference.md](reference.md) — short index of repo anchors.
