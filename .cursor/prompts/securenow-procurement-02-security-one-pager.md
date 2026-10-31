# SN-PROC-02 — SecureNow buyer security one-pager

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

A security reviewer can read one SecureNow page and answer what is collected, what the product does not do, how a later capture is labeled, and which assurance claims are refused.

## Why

The pilot objection table in `CONTROLLED_PILOT_OFFER.md` already has the answers. They sit inside an internal proposal. Reviewers need a single page they can attach, with the same refusals, without treating the page as an approved offer.

## Read first

- `docs/securenow/PROCUREMENT_PACK_INDEX.md` (SN-PROC-01; link it)
- `docs/securenow/CONTROLLED_PILOT_OFFER.md` (objection table and qualification "do not begin" list)
- `docs/securenow/BUYER_PROOF_DEMO.md`
- `docs/securenow/SUPPORT_COMMITMENT.md`
- `docs/securenow/PRIVATE_PRICE_SHEET.md` (cite the file; do not copy the fee table)
- `docs/securenow/MARKETPLACE_PREPUBLICATION_CONTRACT.md`
- `docs/securenow/BETA_EVIDENCE_GATE.md`
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`
- `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md`
- `docs/go-to-market/SOC2_STATUS_PROCUREMENT.md`
- `scripts/ci/check_securenow_buyer_proof.py`
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims` source lists)
- `scripts/ci/test_commercial_claim_scope.py` (`SOURCES`)

## What to build

1. Branch `sn-proc/02-security-one-pager` from current `master` (include SN-PROC-01 if it is not on `master` yet).
2. Add `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`.
3. First line is a Scope blockquote: buyer security brief for a SecureNow controlled-pilot conversation; not an approved customer offer; beta remains NO_GO.
4. Open with a one-line banner a reviewer cannot miss: **NOT AN APPROVED CUSTOMER OFFER.** SecureNow beta remains **NO_GO**.
5. Sections, in this order, each short:
    - **What SecureNow is for.** Possible Azure permission and network paths, cited hops, advisory cut points, and a later capture. A synthetic demo is **not** customer evidence.
    - **What is collected.** Tenant-authorized Reader inventory or an approved upload. Partial or missing collection stays visible. Name ADR 0103 for the in-tenant collection agent as an architecture decision, not a live customer deployment.
    - **What SecureNow does not do.** It does not change Azure. The customer changes Azure **outside** SecureNow. No autonomous remediation. No observed exploit. No breach-prevention warranty.
    - **How verification is labeled.** A later successful capture, chronology, and a substantive postcondition are required before a verified label. Otherwise **NOT VERIFIED** or insufficient evidence. Human attestation of an external change is separate from the advisory recommendation.
    - **Tenant scope.** Point at ADR 0037 for database-per-tenant. Do not claim SQL RLS. State that an ArchLucid architecture-review subscription is not a SecureNow entitlement (Marketplace contract stays **HOLD**).
    - **Assurance.** Point at `SOC2_STATUS_PROCUREMENT.md`. Say there is no CPA-issued SOC 2 report in this pack. Do not claim a SecureNow third-party penetration test.
    - **Support and price.** Point at `SUPPORT_COMMITMENT.md` and `PRIVATE_PRICE_SHEET.md`. Say acknowledgement targets are not a contractual SLA and not service credits. Say the quote sheet is not a public list price. Do not print dollar amounts.
    - **Where to read next.** Link `PROCUREMENT_PACK_INDEX.md`, `CONTROLLED_PILOT_OFFER.md`, and `BETA_EVIDENCE_GATE.md`.
6. The page body must contain these substrings so the disclosure checker can see them: `NOT AN APPROVED`, `NO_GO`, `outside`, `NOT VERIFIED`, `not customer evidence`, `SOC 2`.
7. Register the file:
    - Add it to `FILES` and `REQUIRED` in `scripts/ci/check_securenow_buyer_proof.py` with those substrings (case-insensitive match already exists).
    - Add `docs/securenow/BUYER_SECURITY_ONE_PAGER.md` to the SecureNow list inside `claims()` in `scripts/ci/build_two_product_commercial_workpack.py`.
    - Add the same path to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, and to any test fixture that writes the SecureNow claim sources under a temp root (`scripts/ci/test_build_two_product_commercial_workpack.py`). A missing file in that fixture must stay a missing-source failure only when the fixture omits it on purpose.
8. Add a README bullet under commercial engineering that links the one-pager and says it is not an approved offer.

## Tests

From repo root:

```bash
python3 scripts/ci/check_securenow_buyer_proof.py
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit the pilot checklist, the private quote sheet, the support commitment, or the Marketplace contract.
- Do not add a route, a marketing nav item, or a link from the public header.
- Do not check an owner checklist box or mark a beta matrix row PASS.
- Do not commit.

## Done when

The one-pager states collection, non-goals, verification labels, and refused assurance claims, and the existing buyer-proof and commercial-claim checks include the new file.
