# SN-PROC-03 — SecureNow procurement response overlay

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

Twenty short rows a reviewer can paste into a SIG- or CAIQ-style spreadsheet when the question is about SecureNow, not about architecture review. Each row points at a file that already exists. Platform controls stay in the ArchLucid accelerator.

## Why

`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md` answers architecture-review diligence. SecureNow answers differ on Azure writes, path meaning, collection gaps, product entitlement, and beta status. Rewriting the ArchLucid packet would mix the two products.

## Read first

- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md` if SN-PROC-02 has landed; otherwise `docs/securenow/CONTROLLED_PILOT_OFFER.md`
- `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md` (do not edit; note the audience line says ArchLucid)
- `docs/securenow/BETA_EVIDENCE_GATE.md`
- `docs/securenow/MARKETPLACE_PREPUBLICATION_CONTRACT.md`
- `docs/go-to-market/SUBPROCESSORS.md`
- `docs/go-to-market/DPA_TEMPLATE.md`
- `infra/terraform-securenow-in-tenant/README.md`
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims`)
- `scripts/ci/test_commercial_claim_scope.py`

## What to build

1. Branch `sn-proc/03-response-overlay` from current `master` (include SN-PROC-01).
2. Add `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`.
3. First line is a Scope blockquote: SecureNow answer overlay for security questionnaires. Not a completed SIG or CAIQ. Not an approved offer. Beta remains NO_GO.
4. One sentence under the title: use `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` for platform controls; use this file only where the SecureNow answer differs.
5. A table with columns `Theme`, `Question`, `Answer`, `Source`. **20 rows** (not fewer than 18, not more than 25). Cover at least these themes, one row each:
    - Azure write scope (no in-product apply; change happens **outside** SecureNow).
    - Whether a path proves an attacker used it (no; separate observed configuration from inference).
    - SOC 2 (no CPA-issued report; link the platform status statement; do not say certified).
    - Third-party penetration test (do not claim one for SecureNow; point at `docs/library/V1_DEFERRED.md` for the deferred program).
    - Data collected (Reader inventory or approved upload).
    - Partial collection (gaps stay visible; no false clean status).
    - Tenant isolation (ADR 0037; no SQL RLS claim).
    - Cross-product entitlement (ArchLucid plan success is not SecureNow access; Marketplace **HOLD**).
    - Retention and exit (pilot terms **TO BE NEGOTIATED**; DPA is a template until executed).
    - Support hours versus SLA (acknowledgement target is not a contractual SLA and not service credits).
    - Price (private quote sheet is not a public list price and not a customer offer; do not print dollar amounts).
    - Marketplace listing (not live; `HOLD_NO_PUBLICATION`).
    - In-tenant deployment option (ADR 0104 and the terraform README as design, not a customer go-live).
    - Verification label (**NOT VERIFIED** when a later successful capture or postcondition is missing).
    - Synthetic demo (**not** customer evidence).
    - Beta release (NO_GO until the 22-row gate and the owner checklist are cleared; do not mark PASS).
    - Subprocessors (platform register; customer policy still applies).
    - Identity (customer's Entra and the product's tenant binding; do not invent a new IdP).
    - Logging and support intake (`security@archlucid.net`; no new mailbox).
    - Breach-prevention warranty (refused).
6. Every `Source` cell is a markdown link to a file that exists. Prefer the one-pager or the pack index when SN-PROC-02 exists; otherwise link the pilot offer or the ADR.
7. Add the overlay path to the SecureNow list in `claims()` and to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, plus the temp-root fixture in `scripts/ci/test_build_two_product_commercial_workpack.py` if that fixture enumerates SecureNow claim files.
8. Add a README bullet that links the overlay and says it is not a completed questionnaire and not an approved offer.

## Tests

```bash
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `BUYER_SECURITY_PROCUREMENT_PACKET.md` or `PROCUREMENT_PACK_INDEX.md` under `docs/go-to-market/`.
- Do not copy fee amounts from `PRIVATE_PRICE_SHEET.md`.
- Do not check pilot checklist boxes or mark beta matrix rows PASS.
- Do not commit.

## Done when

The overlay has 18–25 SecureNow-specific rows with working source links, and the commercial claim scanner includes the new file. The ArchLucid procurement packet is unchanged.
