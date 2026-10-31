# SN-PROC-06 — SecureNow subprocessors delta

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

One page that tells a reviewer which rows of the platform subprocessors register apply to hosted SecureNow, which apply to in-tenant SecureNow, and which customer-owned Azure resources are not ArchLucid subprocessors.

## Why

`docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md` answers subprocessors with "use the platform register." `docs/go-to-market/SUBPROCESSORS.md` describes ArchLucid architecture-review content (architecture text, findings, exports). A SecureNow reviewer cannot tell whether that list is the SecureNow list.

## Read first

- `docs/go-to-market/SUBPROCESSORS.md`
- `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md`
- `docs/architecture/adrs/0104-securenow-in-tenant-deployment.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`
- `docs/securenow/DATA_PROCESSING_SCHEDULE.md` if SN-PROC-05 has landed
- `infra/terraform-securenow-in-tenant/README.md`
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims`)
- `scripts/ci/test_commercial_claim_scope.py`
- `scripts/ci/test_build_two_product_commercial_workpack.py`

## What to build

1. Branch `sn-proc/06-subprocessors-delta` from current `master`. Include SN-PROC-05 if it has merged. Do not redo SN-PROC-01 through SN-PROC-04.
2. Add `docs/securenow/SUBPROCESSORS_DELTA.md`.
3. First line is a Scope blockquote: SecureNow reading of the platform subprocessors register. Not a new subprocessor. Not an executed DPA. Not an approved customer offer. Beta remains NO_GO.
4. One sentence under the title: the register that changes is `docs/go-to-market/SUBPROCESSORS.md`. This file does not add a vendor.
5. A table with columns `Register row`, `Hosted SecureNow`, `In-tenant SecureNow`, `Notes`. One row for each service row already in the platform register:
    - Azure host services (Container Apps, SQL, Blob, Key Vault, and the other services named in that first row)
    - Microsoft Entra ID
    - Azure OpenAI Service
6. A further row for the register section **Optional third-party completion engines (not yet offered)**. Both hosting columns say the register's own fact: no external completion engine is tenant-selectable today.
7. Cell text is only `Applies`, `Customer-operated boundary`, or `Not offered`. Put the explanation in Notes, with a markdown link to the ADR or register section you used.
    - Hosted SecureNow uses the platform register rows that the register already lists for the hosted service.
    - In-tenant SecureNow runs the API, worker, and UI in the customer subscription (ADR 0104). Customer-owned Automation and the customer-owned blob handoff in ADR 0103 are customer resources, not ArchLucid subprocessors. Say that in Notes. Do not list them as subprocessors.
    - Azure OpenAI: repeat only the data category the register already states (prompts and completions that may include customer content). Do not add a SecureNow-specific prompt inventory.
8. A short section `## What this page does not do`. State that it does not edit the platform register, does not start the 30-day new-subprocessor notice, and does not name a non-Microsoft vendor.
9. Add one **Self-attested** row to the SecureNow-specific status map in `docs/securenow/PROCUREMENT_PACK_INDEX.md`, and one **Self-asserted** evidence row. The buyer-safe claim says this is a reading of the platform register, not a second register. Link `SUBPROCESSORS_DELTA.md`. Update **Last reviewed** to today's UTC date.
10. In `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`, change only the Subprocessors **Answer** and **Source** so the answer points at `SUBPROCESSORS_DELTA.md` and still says the platform register is the list that changes. Do not add or remove overlay rows.
11. Add `docs/securenow/SUBPROCESSORS_DELTA.md` to the SecureNow list in `claims()`, to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, and to the temp-root fixture in `scripts/ci/test_build_two_product_commercial_workpack.py` if that fixture lists SecureNow claim files.
12. Add a README bullet that links the delta and says it is not a new subprocessor and not an approved offer.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 scripts/ci/check_securenow_buyer_proof.py
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/go-to-market/SUBPROCESSORS.md` or any other file under `docs/go-to-market/`.
- Do not add a vendor, a region name, or a data category that the register and the two ADRs do not already state.
- Do not copy fee amounts from `PRIVATE_PRICE_SHEET.md`.
- Do not commit.

## Done when

A reviewer can answer "which platform subprocessors apply to SecureNow?" from one table, the platform register file is unchanged, and the overlay subprocessors row cites the delta.
