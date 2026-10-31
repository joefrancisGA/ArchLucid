# SN-PROC-04 — Static check for the SecureNow procurement pack

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

CI fails when the SecureNow procurement index, one-pager, or overlay drops a required file, breaks a link, uses an unknown status, or states an assurance claim that this pack is not allowed to make.

## Why

`scripts/ci/check_procurement_pack_index.py` validates only `docs/go-to-market/PROCUREMENT_PACK_INDEX.md`. A second product index will rot unless it has its own check. Extending the ArchLucid parser to read the SecureNow file would mix the two packs.

## Read first

- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`
- `scripts/ci/check_procurement_pack_index.py` (status sets and link resolution ideas; do not change its ArchLucid path)
- `scripts/ci/check_securenow_buyer_proof.py`
- `.github/workflows/ci.yml` (step `Procurement PACK_INDEX table validation`, around the `check_procurement_pack_index.py` invocation)
- `.github/workflows/commercial-readiness-ten-lane.yml` (unittest module list)

## What to build

1. Branch `sn-proc/04-pack-check` from current `master` after SN-PROC-01, SN-PROC-02, and SN-PROC-03 are present.
2. Add `scripts/ci/check_securenow_procurement_pack.py`.
3. The script reads these three files from the repo root and exits 1 when any are missing:
    - `docs/securenow/PROCUREMENT_PACK_INDEX.md`
    - `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
    - `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`
4. Index checks:
    - Heading `## Procurement artifact status map (buyer-safe classification)` is present.
    - Status-map `Status` cells are only `Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`.
    - A `Deferred` status-map row includes `V1_DEFERRED` in Notes.
    - The evidence table header contains `Evidence Artifact`. Evidence Type is only `Implemented`, `Self-asserted`, `In flight`, or `Deferred V1.1`.
    - Every markdown link whose target does not start with `http` resolves to a file relative to that markdown file's directory. Ignore pure anchors.
5. One-pager checks: body contains `NOT AN APPROVED`, `NO_GO`, `outside`, `NOT VERIFIED`, and `SOC 2` (case-insensitive).
6. Overlay checks: at least 18 data rows in the question table, and at least one link to `PROCUREMENT_PACK_INDEX.md` or `CONTROLLED_PILOT_OFFER.md`.
7. Forbidden bare claims. Fail when a line matches any of these phrases and that same line does not also match a denial (`do not`, `not a`, `not an`, `no cpa`, `without`, `never`):
    - `SOC 2 certified`
    - `SOC 2 Type II issued`
    - `ISO 27001 certified`
    - `third-party penetration test completed`
    - `guaranteed ROI`
    - `guaranteed savings`
    - `guaranteed breach prevention`
    - `autonomous remediation`
    - `observed exploit`
8. Add `scripts/ci/test_check_securenow_procurement_pack.py` using `unittest`. Cover: the real repo files pass; a temp copy with a broken relative link fails; a temp copy with `SOC 2 certified` and no denial on that line fails; a temp copy with `Do not say SOC 2 certified` on one line passes that phrase check.
9. In `.github/workflows/ci.yml`, add a step immediately after `Procurement PACK_INDEX table validation`:
    - name: `SecureNow procurement pack index`
    - `continue-on-error: true` (same as the ArchLucid pack step)
    - `run: python scripts/ci/check_securenow_procurement_pack.py`
    - And a unittest step matching the neighboring `unittest discover` style for `test_check_securenow_procurement_pack.py`, also `continue-on-error: true`.
10. In `.github/workflows/commercial-readiness-ten-lane.yml`, add `scripts.ci.test_check_securenow_procurement_pack` to the existing unittest invocation. That workflow lists modules explicitly. Also add `scripts/ci/check_securenow_procurement_pack.py` and `scripts/ci/test_check_securenow_procurement_pack.py` to that workflow's `pull_request` path filters so a pack-check change runs the workflow.
11. Do not change `check_procurement_pack_index.py` to parse the SecureNow index.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 -m unittest scripts.ci.test_check_securenow_procurement_pack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not weaken `continue-on-error` on existing ArchLucid steps.
- Do not mark beta matrix rows PASS or check the pilot owner checklist.
- Do not commit.

## Done when

The checker passes on the three SecureNow docs, unit tests cover a broken link and a bare certification claim, and CI invokes the checker beside the ArchLucid pack check.
