# SN-PROC-05 — SecureNow data-processing schedule

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

A redlineable SecureNow data-processing schedule a lawyer can mark up. It states what this repository already says about collection, hosting, residency, and deletion. It leaves blanks where the pilot offer still says the term is not agreed.

## Why

`docs/securenow/CONTROLLED_PILOT_OFFER.md` still marks duration, hosting, retention, and exit as **TO BE NEGOTIATED**. `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md` repeats that blank. A reviewer cannot redline a blank. The platform DPA is a template for the ArchLucid vendor relationship. It is not a SecureNow order form.

## Read first

- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`
- `docs/securenow/CONTROLLED_PILOT_OFFER.md`
- `docs/go-to-market/DPA_TEMPLATE.md` (sections 4, 5, 9, and 10A)
- `docs/go-to-market/SUBPROCESSORS.md` (data residency section only)
- `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md`
- `docs/architecture/adrs/0104-securenow-in-tenant-deployment.md`
- `infra/terraform-securenow-in-tenant/README.md`
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims`)
- `scripts/ci/test_commercial_claim_scope.py`
- `scripts/ci/test_build_two_product_commercial_workpack.py`

## What to build

1. Branch `sn-proc/05-data-schedule` from current `master`. SN-PROC-01 through SN-PROC-04 are already merged. Do not redo them.
2. Add `docs/securenow/DATA_PROCESSING_SCHEDULE.md`.
3. First line is a Scope blockquote: SecureNow data-processing schedule for negotiation. Template only. Not an executed DPA. Not an approved customer offer. Beta remains NO_GO.
4. Use these headings, in this order:
    - `## Status`
    - `## Two hosting modes`
    - `## Data categories`
    - `## What does not happen`
    - `## Region`
    - `## Retention and exit`
    - `## Blanks for legal`
    - `## Sources`
5. **Status.** Say the schedule is **Template**. Say it does not execute `docs/go-to-market/DPA_TEMPLATE.md` and does not check the pilot checklist.
6. **Two hosting modes.** Describe only what ADR 0104 already decides:
    - `ArchLucidHosted`: shared platform host. Point at the platform DPA as the template for that vendor relationship.
    - `InTenant`: API, worker, and operator UI in the customer subscription. Say this is an accepted design, not proof of a live customer deployment.
    Do not collapse the two modes into one processor role. Where the repository does not name the legal role for a mode, write "not stated in this repository" and add a blank in **Blanks for legal**.
7. **Data categories.** Limit the list to categories already named in the one-pager, ADR 0103, or the platform DPA. Include tenant-authorized Azure Reader inventory and an approved upload. If you mention platform personal-data categories from DPA section 4, label them as the platform template, not as a SecureNow-only inventory. Do not add customer documents, secrets, or Defender alerts unless a Read first file already says SecureNow collects them.
8. **What does not happen.** SecureNow does not apply ARM or Terraform changes. Changes happen **outside** SecureNow. Do not describe autonomous remediation or an observed exploit as a product capability.
9. **Region.** Cite the subprocessors register: production region is per deployment or subscription until a single public primary region is published. For `InTenant`, say the customer subscription is the deployment boundary named in ADR 0104. Do not name a city or Azure region that the Read first files do not name.
10. **Retention and exit.** Quote the pilot offer: retention and exit are **TO BE NEGOTIATED**. In a separate sentence, cite DPA section 9 as the platform template figure (deletion within **90 days** except law or documented backup cycles). Label that figure **platform template, not a SecureNow order**. Do not invent a SecureNow-specific day count. Do not copy the 45-day evaluation length from `PRIVATE_PRICE_SHEET.md`.
11. **Blanks for legal.** A short table with columns `Blank`, `Why it is blank`, `Where a lawyer looks`. Include at least: pilot duration, whether the customer is controller for each hosting mode, SecureNow-specific retention if it differs from the platform template, and the order-form id. Use angle-bracket placeholders such as `<<pilot duration>>`. Do not fill them.
12. **Sources.** Markdown links to the files you cited. Every link must resolve.
13. Add one **Template** row to the SecureNow-specific status map in `docs/securenow/PROCUREMENT_PACK_INDEX.md`, and one **Self-asserted** evidence row whose buyer-safe claim says the schedule is a template and not an executed DPA. Link `DATA_PROCESSING_SCHEDULE.md`. Update **Last reviewed** on the index to today's UTC date.
14. Add `docs/securenow/DATA_PROCESSING_SCHEDULE.md` to the SecureNow list in `claims()`, to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, and to the temp-root fixture in `scripts/ci/test_build_two_product_commercial_workpack.py` if that fixture lists SecureNow claim files.
15. Add a README bullet under Commercial engineering that links the schedule and says it is a template, not an executed DPA, and not an approved offer.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 scripts/ci/check_securenow_buyer_proof.py
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/go-to-market/DPA_TEMPLATE.md`, `docs/go-to-market/SUBPROCESSORS.md`, `docs/go-to-market/PROCUREMENT_PACK_INDEX.md`, or `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`.
- Do not copy fee amounts, meter caps, or the 45-day length from `docs/securenow/PRIVATE_PRICE_SHEET.md`.
- Do not check pilot checklist boxes or mark beta matrix rows PASS.
- Do not commit.

## Done when

The schedule distinguishes hosted and in-tenant modes, cites the 90-day platform template without adopting it as a SecureNow order, keeps **TO BE NEGOTIATED** blanks, and the pack checker still passes.
