# SN-LIFT-19 — Lock welcome and footer off the public SecureNow links

**Superseded for sample links (owner 2026-11-02):** welcome and the marketing footer now ship the Healthcare Claims sample review and `/securenow-sample`. This prompt still describes the pre-lift hold; the checker requires those two links and still forbids `/why-securenow` on welcome and the footer.

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The marketability checker rejects `/why-securenow` and `/securenow-sample` on the welcome page and the marketing footer.

## Why

Marketability is 70 (weight 8). The in-page links and sample beats are shipped. Welcome and footer links stay off until the owner approves them. The checker should keep that hold from regressing. This prompt does not raise the score by itself.

## Read first

- `scripts/ci/check_securenow_marketability.py`
- `archlucid-ui/src/components/marketing`

## What to build

1. Branch `sn-lift/19-marketability-hold-lock` from current `master`.
2. Find the welcome page and marketing footer source files that render public links.
3. Extend `check_securenow_marketability.py` so those files must not contain `/why-securenow` or `/securenow-sample`.
4. If they already contain those hrefs, stop and report that. Do not remove a link the owner has approved in this session.
5. Add a negative test that inserts `/why-securenow` into a temp copy of the welcome file and expects failure.
6. Do not add the links. Do not publish a price.

## Tests

From the repo root: `python3 scripts/ci/check_securenow_marketability.py` and `python3 -m unittest scripts.ci.test_check_securenow_marketability`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Welcome and footer still omit the two SecureNow public hrefs, and the checker fails if a temp copy adds one.
