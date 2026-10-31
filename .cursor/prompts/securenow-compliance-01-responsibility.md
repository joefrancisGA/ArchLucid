# SN-COMP-01 — SecureNow control-evidence responsibility

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

A short responsibility note a GRC reviewer can use when asking what SecureNow proves about a customer control. It names who records disposition, what the product cites, and what the product does not certify.

## Why

Compliance Readiness scored **48** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **71** on the platform self-assessment matrix. SecureNow already has frameworks, audit evidence, and a human disposition. The missing artifact is a buyer-safe split of duties. A CPA SOC 2 program is **G-REAL-05** and is out of scope.

## Read first

- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md`
- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md` (SOC 2 row only)
- `docs/securenow/FIXTURE_STORYBOARD.md` (beat 6 only)
- `docs/go-to-market/SOC2_STATUS_PROCUREMENT.md` (honesty only; do not copy the platform matrix into this file)

## What to build

1. Branch `sn-comp/01-responsibility` from current `master`.
2. Add `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md`.
3. First line is a Scope blockquote: SecureNow control-evidence responsibility for a customer framework. Not an ATO. Not a CPA SOC 2 report. Not a CMS attestation. Not an approved customer offer. Beta remains NO_GO.
4. One sentence under the title: a person records control disposition. SecureNow cites the evidence chain.
5. A table with columns `Duty`, `Customer control owner`, `SecureNow`, `Out of scope`. **Exactly 6 data rows:**
    - Collection scope and freshness — the customer authorizes the Azure scope; SecureNow shows the environment line, collection time, and any gap; a gap is not a clean bill of health.
    - Path or finding citation — the customer names the concern; SecureNow shows cited hops and provenance; an observed exploit is out of scope.
    - Advisory cut — the customer decides the change; SecureNow shows an advisory cut point; Azure writes and `terraform apply` are out of scope.
    - Later verification — the customer supplies a later capture and attestation; SecureNow shows **NOT VERIFIED** when any required element is missing; a silent pass is out of scope.
    - Control disposition — a GRC analyst records the disposition; SecureNow links the control to snapshot evidence and any verified remediation association; a model-marked “control evidenced” is out of scope.
    - Assurance opinion — the customer’s auditor or assessor issues any opinion; SecureNow does not certify the environment; CPA SOC 2, ISO 27001 certification, and a CMS ATO are out of scope.
6. A short section `## What this note does not include`. State that it does not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, that it does not start **G-REAL-05** or **G-ASSURANCE-02**, and that a fixture walkthrough is not customer evidence.
7. In `docs/securenow/PROCUREMENT_PACK_INDEX.md`, add one **SecureNow-specific** status-map row: artifact `Control-evidence responsibility`, status `Template`, source link to the new file, notes that it is a duty split and not an attestation. Do not remove existing rows.
8. Add a README bullet under Commercial engineering that links the note and says it is a duty split, not a certification.

## Tests

Run `python3 scripts/ci/check_securenow_procurement_pack.py` and confirm it still exits 0. Read the new file and confirm six data rows.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not edit `docs/security/COMPLIANCE_MATRIX.md` or `docs/security/SOC2_SELF_ASSESSMENT_2026.md`.
- Do not add a product route, a help page, or a marketing nav item.
- Do not add the new file to `claims()` in `build_two_product_commercial_workpack.py`.
- Do not commit.

## Done when

The responsibility note has exactly six rows, the procurement pack checker still passes, and the executive proof packet is unchanged.
