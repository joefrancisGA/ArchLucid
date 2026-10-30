# SN-PROC-01 — SecureNow procurement pack index

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

A reviewer can open one SecureNow file and see which procurement artifacts exist, what status each has, and which file is the source. The file does not approve an offer.

## Why

Procurement Readiness is 38. `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` is the architecture-review pack. SecureNow commercial docs are internal drafts (`CONTROLLED_PILOT_OFFER.md` says not an approved customer offer; beta remains NO_GO). Reusing the ArchLucid ZIP as the SecureNow pack would mix review governance with path analysis and Reader collection.

## Read first

- `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` (status vocabulary and table shape only; do not edit it)
- `scripts/ci/check_procurement_pack_index.py` (`STATUS_MAP_STATUSES`, `APPROVED_TYPES`)
- `docs/securenow/CONTROLLED_PILOT_OFFER.md`
- `docs/securenow/BETA_EVIDENCE_GATE.md`
- `docs/securenow/MARKETPLACE_PREPUBLICATION_CONTRACT.md`
- `docs/securenow/PRIVATE_PRICE_SHEET.md`
- `docs/securenow/SUPPORT_COMMITMENT.md`
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md`
- `docs/securenow/BUYER_PROOF_DEMO.md`
- `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md`
- `docs/architecture/adrs/0104-securenow-in-tenant-deployment.md`
- `docs/go-to-market/DPA_TEMPLATE.md`
- `docs/go-to-market/SOC2_STATUS_PROCUREMENT.md`
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`
- `docs/go-to-market/trust-center.md`

## What to build

1. Branch `sn-proc/01-pack-index` from current `master`.
2. Add `docs/securenow/PROCUREMENT_PACK_INDEX.md`.
3. First line is a Scope blockquote. State that this is a SecureNow evidence index for a controlled-pilot conversation, not an approved offer, not a public price, and not a certification.
4. Include `**Last reviewed:**` with today's UTC date.
5. Include this heading exactly: `## Procurement artifact status map (buyer-safe classification)`.
6. Under that heading, a four-column table: `Procurement Artifact` | `Status` | `Source File` | `Notes`.
7. Status cells use only: `Implemented`, `Self-attested`, `Template`, `Deferred`, `Not applicable`, `External/NDA-gated`. A `Deferred` row's Notes must contain `V1_DEFERRED`.
8. Include a second table whose header row starts with `| Evidence Artifact |` and whose columns are `Evidence Artifact`, `Evidence Type`, `Last Reviewed UTC`, `Source File`, `Buyer-safe Claim`. Evidence Type is only `Implemented`, `Self-asserted`, `In flight`, or `Deferred V1.1`.
9. Split the body into **SecureNow-specific** and **Platform-shared (do not treat as a SecureNow certification)**.
10. SecureNow-specific rows, each linking a file that exists today:
    - Controlled pilot proposal — status that means not an approved offer (use `Template` if the vocabulary has no Hold; Notes say internal proposal, beta **NO_GO**, owner checklist unchecked).
    - Beta evidence gate — `Template` or `Self-attested` only if the Notes say requirements stay **UNKNOWN** until a PASS row has `test_command`, `result_reference`, and `commit_sha`. Do not write PASS.
    - Marketplace prepublication — Notes say **HOLD_NO_PUBLICATION** and that an ArchLucid subscription is not a SecureNow entitlement.
    - Private quote sheet — Notes say owner-approved fees only, **not a public list price**, not a customer offer. Do not copy dollar amounts into this index.
    - Support commitment — Notes say founder acknowledgement targets, **not** a contractual SLA and **not** service credits.
    - Executive proof packet — `Template`.
    - Buyer demonstration script — Notes say a synthetic demo is **not** customer evidence.
    - In-tenant collection ADR 0103 and deployment ADR 0104 — `Implemented` only as accepted architecture decisions, not as a live customer deployment.
    - `infra/terraform-securenow-in-tenant/README.md` if that file exists — `Self-attested` engineering description, not a deployed tenant.
11. Platform-shared rows point at existing paths. Do not paste their bodies:
    - DPA template (`Template`).
    - SOC 2 procurement status (`Self-attested`; Notes say no CPA Type II report).
    - Tenant isolation ADR 0037 (`Implemented`).
    - Trust center (`Self-attested` index for the platform; Notes say it is not a SecureNow product offer).
12. Add one bullet under `docs/securenow/README.md` commercial engineering that links this index and says it is not an approved offer.
13. Every markdown link must resolve to a file in the repo. Use paths relative to `docs/securenow/PROCUREMENT_PACK_INDEX.md`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/go-to-market/PROCUREMENT_PACK_INDEX.md`, `CONTROLLED_PILOT_OFFER.md` checkboxes, `PRIVATE_PRICE_SHEET.md`, `SUPPORT_COMMITMENT.md`, or `MARKETPLACE_PREPUBLICATION_CONTRACT.md`.
- Do not add dollar amounts, a public price, a beta GO, or a checked owner checklist box.
- Do not write "SOC 2 certified", "SOC 2 Type II issued", "ISO 27001 certified", "third-party penetration test completed", "guaranteed ROI", "guaranteed savings", "guaranteed breach prevention", "autonomous remediation", or "observed exploit" except inside a sentence that denies the claim on that same line.
- Do not add a help route, a marketing nav link, or a Trust Center ZIP entry.
- Do not commit.

## Done when

`docs/securenow/PROCUREMENT_PACK_INDEX.md` lists SecureNow artifacts and platform-shared pointers with legal status labels, and `docs/securenow/README.md` links it. ArchLucid's procurement index is unchanged.
