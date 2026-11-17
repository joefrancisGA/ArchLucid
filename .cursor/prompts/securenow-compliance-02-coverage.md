# SN-COMP-02 — SecureNow framework coverage card

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

A coverage card that lists framework packs SecureNow already ships, what those packs cite, and the sentence that thematic mapping is not certification.

## Why

Buyers read “NIST” as a full catalog and an attestation. `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` already names the featured packs and says organization placeholder text is not a certification. That sentence is not in a buyer-facing card. Inventing pack counts, or copying controls into this file, would create a second catalog.

## Read first

- `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md`
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` (edition differences only)
- `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md` (disclaimer paragraph only)
- `docs/library/POLICY_PACK_ARC_AMPE_DESIGN.md` (disclaimer rows only)
- The pack JSON you will cite. Open each file before you count anything. If a file is missing, omit that row.

## What to build

1. Branch `sn-comp/02-coverage` from current `master` after SN-COMP-01 has merged.
2. Add `docs/securenow/FRAMEWORK_COVERAGE.md`.
3. First line is a Scope blockquote: SecureNow framework coverage card. Thematic mapping only. Not a certification. Not a full catalog. Not an approved customer offer. Beta remains NO_GO.
4. One sentence under the title: `frameworkMappings` cite a theme. They do not pass or fail a statute.
5. A table with columns `Pack`, `What the mapping cites`, `Honest limit`. Include a row only when you opened the pack file. Expected candidates, in this order, skipping any you cannot open:
    - Microsoft cloud security benchmark
    - NIST SP 800-53 (only if a pack file you opened cites it)
    - OWASP ASVS (only if a pack file you opened cites it)
    - `arc-ampe-architecture-themes`
    - `organization-security-architecture-starter`
6. For each included row, `What the mapping cites` is one phrase taken from that pack’s `frameworkMappings` or metadata, not a pasted control list. `Honest limit` must say the pack is not a certification. For ARC-AMPE, also say it is not a CMS attestation. For the organization starter, say placeholders are the architect’s text.
7. A short section `## Editions`. Repeat the generic versus UHG lead from the handoff note in two sentences. Do not add a new edition.
8. In `docs/securenow/PROCUREMENT_PACK_INDEX.md`, add one **SecureNow-specific** status-map row: artifact `Framework coverage card`, status `Self-attested`, source link to the new file, notes that mappings are thematic and not an attestation. Do not remove existing rows.
9. Add one README bullet that links the card and says it is a coverage index, not a certification.

## Tests

Run `python3 scripts/ci/check_securenow_procurement_pack.py` and confirm it still exits 0. Confirm every pack link in the card resolves to a file you opened.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add or edit policy-pack JSON.
- Do not paste control identifiers in bulk.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not claim SOC 2 certification, ISO 27001 certification, or a completed third-party penetration test.
- Do not commit.

## Done when

The card lists only packs whose files you opened, each row refuses certification, and the procurement pack checker still passes.
