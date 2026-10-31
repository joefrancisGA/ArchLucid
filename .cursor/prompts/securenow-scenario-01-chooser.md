# SN-ACCEL-01 — SecureNow scenario chooser

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ACCEL prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCENARIO_ACCELERATOR_COMPOSER_PROMPTS.md`

## Goal

A five-row chooser that maps a buyer job to a fixture SecureNow already has. A facilitator picks a row instead of inventing a second demo.

## Why

Template and Accelerator Richness is 42 because SecureNow has one storyboard and an empty executive proof form. ArchLucid's starter proof packs are the comparison, and TB-170 already decided not to add ArchLucid template volume for its own sake. This chooser does not copy that catalog.

## Read first

- `docs/securenow/FIXTURE_STORYBOARD.md`
- `docs/securenow/BUYER_PROOF_DEMO.md`
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (do not edit)
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs` (the Contributor role fact only)
- `templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md` (shape idea only; do not edit and do not link these packs as SecureNow scenarios)

## What to build

1. Branch `sn-accel/01-chooser` from current `master`.
2. Add `docs/securenow/SCENARIO_CHOOSER.md`.
3. First line is a Scope blockquote: SecureNow scenario chooser for fixture walkthroughs. Not customer evidence. Not a starter proof pack. Not an approved offer. Beta remains NO_GO.
4. One sentence under the title: pick one row. Do not present the fixture as a customer outcome.
5. A table with columns `Scenario`, `Buyer job`, `Open this`, `Honest label`, `Pack`. **Exactly 5 data rows:**
    - `public-storage-path` — possible public network access on a storage account. `Open this` links `FIXTURE_STORYBOARD.md` and `BUYER_PROOF_DEMO.md`. Honest label: fixture, not an observed exploit.
    - `collection-gap` — a missing or stale capture stays visible. `Open this` links storyboard beat 1 (heading anchor). Honest label: a gap is not a clean bill of health.
    - `advisory-cut-no-write` — an advisory cut point, with the change applied outside SecureNow. `Open this` links storyboard beats 3 and 4. Honest label: SecureNow does not change Azure.
    - `later-capture-not-verified` — a later capture that is missing an element. `Open this` links storyboard beat 5. Honest label: **NOT VERIFIED**.
    - `contributor-role-between-snapshots` — a unit fixture where removing a Contributor assignment removes probable privilege paths. `Open this` links `SecureNowArchitectTwoSnapshotGoldenFixtureTests.cs`. Honest label: unit fixture, not a sponsor demo.
6. The `Pack` column for every row is the text `(pack in SN-ACCEL-02)` until that prompt lands. Do not create the pack files in this session.
7. A short section `## What this chooser does not include`. State that it does not include `templates/starter-proof-packs/`, that it does not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, and that a fixture is not customer evidence.
8. Add a README bullet under Commercial engineering that links the chooser and says it is a fixture index, not customer traction.

## Tests

Read the new file and confirm five data rows and that every `Open this` link resolves to a file that exists.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not edit anything under `templates/starter-proof-packs/`.
- Do not add a product route, a help page, or a marketing nav item.
- Do not commit.

## Done when

The chooser has exactly five rows, each pointing at a file you opened, and the executive proof packet is unchanged.
