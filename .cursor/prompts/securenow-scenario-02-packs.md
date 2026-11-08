# SN-ACCEL-02 — One pack per SecureNow scenario

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ACCEL prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCENARIO_ACCELERATOR_COMPOSER_PROMPTS.md`

## Goal

Five short pack files, one per chooser row. Each pack tells a facilitator what to open, what to point at, and the sentence they must not say. It does not retell the storyboard.

## Why

A chooser row without a pack is still a title. ArchLucid packs are JSON architecture requests. SecureNow packs are fixture instructions. Copying the JSON shape would start the wrong product.

## Read first

- `docs/securenow/SCENARIO_CHOOSER.md`
- `docs/securenow/FIXTURE_STORYBOARD.md`
- `docs/securenow/BUYER_PROOF_DEMO.md`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs` (Contributor fact only)

## What to build

1. Branch `sn-accel/02-packs` from current `master` after SN-ACCEL-01 has merged.
2. Add these files, and no others, under `docs/securenow/scenario-packs/`:
    - `public-storage-path.md`
    - `collection-gap.md`
    - `advisory-cut-no-write.md`
    - `later-capture-not-verified.md`
    - `contributor-role-between-snapshots.md`
3. Each file is at most about 40 lines. Use these headings:
    - `## Intent`
    - `## Open`
    - `## Point at`
    - `## Do not say`
4. First line of each file is a Scope blockquote that includes the words `not customer evidence`.
5. `## Open` is a markdown link to the same target the chooser row uses. Do not invent a new fixture file.
6. `## Do not say` is one sentence already implied by the storyboard or the test:
    - public storage: do not say an attacker used the path or that SecureNow observed an exploit.
    - collection gap: do not say the environment is fully covered.
    - advisory cut: do not say SecureNow changed Azure or applied Terraform.
    - later capture: do not say **Verified** when an element is missing. The honest label is **NOT VERIFIED**.
    - contributor role: do not present the unit test as a customer tenant or a sponsor demonstration.
7. In `docs/securenow/SCENARIO_CHOOSER.md`, replace each `(pack in SN-ACCEL-02)` cell with a markdown link to that pack file. Do not add or remove chooser rows.
8. Add one README bullet that links `scenario-packs/` and says the packs are fixture instructions, not customer evidence.

## Tests

Confirm each chooser `Pack` link resolves and that `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` still contains `NOT COLLECTED`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add `starter-pack.json`, `architecture-request.json`, or `policy-context.json`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not copy fee amounts.
- Do not commit.

## Done when

Five pack files exist, the chooser links them, and the storyboard is still the only narrative for the public-storage walkthrough.
