# SN-ACCEL-03 — Checker for the SecureNow scenario chooser

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ACCEL prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCENARIO_ACCELERATOR_COMPOSER_PROMPTS.md`

## Goal

CI fails when the scenario chooser loses a row, breaks a link, drops the fixture disclaimer, or when someone fills the executive proof packet with claimed outcomes.

## Why

`scripts/ci/check_starter_proof_packs.py` validates ArchLucid starter packs only. A SecureNow chooser will rot unless it has its own check. Extending the ArchLucid script would mix the two catalogs.

## Read first

- `docs/securenow/SCENARIO_CHOOSER.md`
- `docs/securenow/scenario-packs/`
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md`
- `scripts/ci/check_securenow_procurement_pack.py` (link resolution and denial ideas only; do not change it)
- `.github/workflows/ci.yml` (step `Starter proof pack metadata validation`)

## What to build

1. Branch `sn-accel/03-checker` from current `master` after SN-ACCEL-01 and SN-ACCEL-02 are present.
2. Add `scripts/ci/check_securenow_scenario_chooser.py`.
3. The script exits 1 when any of these fail:
    - `docs/securenow/SCENARIO_CHOOSER.md` is missing.
    - The chooser table has fewer than 4 or more than 6 data rows.
    - Any of the five pack files named in SN-ACCEL-02 is missing.
    - A relative markdown link in the chooser or a pack does not resolve to a file. Ignore `http` links and pure anchors.
    - The chooser body does not contain `not customer evidence`.
    - A pack file does not contain `not customer evidence` and `Do not say`.
    - The chooser or a pack links a path under `templates/starter-proof-packs/`.
    - `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` contains fewer than five occurrences of `NOT COLLECTED`.
4. Add `scripts/ci/test_check_securenow_scenario_chooser.py` using `unittest`. Cover: the real repository passes; a temp copy with a broken relative link fails; a temp copy that removes `NOT COLLECTED` from the executive template fails; a temp copy whose pack links `templates/starter-proof-packs/README.md` fails.
5. In `.github/workflows/ci.yml`, add a step immediately after `Starter proof pack metadata validation`:
    - name: `SecureNow scenario chooser`
    - `continue-on-error: true`
    - `run: python scripts/ci/check_securenow_scenario_chooser.py`
    - And a unittest step for `scripts.ci.test_check_securenow_scenario_chooser`, also `continue-on-error: true`.
6. Do not change `check_starter_proof_packs.py` or `check_securenow_procurement_pack.py`.
7. Do not add the chooser or the packs to `claims()` in `build_two_product_commercial_workpack.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_scenario_chooser.py
python3 -m unittest scripts.ci.test_check_securenow_scenario_chooser
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, the three negative tests fail for the right reason, and the ArchLucid starter-pack checker is unchanged.
