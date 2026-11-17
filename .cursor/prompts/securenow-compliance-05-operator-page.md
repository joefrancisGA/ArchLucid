# SN-COMP-05 — Operator page for the duty split and coverage card

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

`/administration/securenow-compliance-notes` shows the shipped duty split and coverage limits to a SecureNow operator. It is an administration page, not a marketing route.

## Why

Compliance Readiness is **66** (weight 2). **SN-COMP-01–04** shipped in PR #5605: `CONTROL_EVIDENCE_RESPONSIBILITY.md`, `FRAMEWORK_COVERAGE.md`, the lineage markdown download, and the warn-only checker. Home **Compliance** still links only policy packs, standards, and audit evidence. The duty split is easy to miss.

## Read first

- `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md`
- `docs/securenow/FRAMEWORK_COVERAGE.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.test.ts`
- `.cursor/prompts/securenow-compliance-hold.md`

## What to build

1. Branch `sn-comp/05-operator-page` from current `master`. Do not redo SN-COMP-01–04.
2. Add `archlucid-ui/src/lib/product-line/securenow-compliance-notes-copy.ts`:
    - Heading `Compliance notes`.
    - Lead `Duty split and framework coverage for a loaded lineage. Not a certification. SecureNow beta remains NO_GO.`
    - Guardrail `This page does not start a CPA SOC 2 program or a third-party pen test.`
    - Six duty titles, in this order: `Collection scope and freshness`, `Path or finding citation`, `Advisory cut`, `Later verification`, `Control disposition`, `Assurance opinion`. One short body each. The assurance body states that SecureNow does not certify the environment.
    - Five pack labels: `Microsoft cloud security benchmark`, `NIST SP 800-53`, `OWASP API Security Top 10`, `arc-ampe-architecture-themes`, `organization-security-architecture-starter`. One sentence after them: `A mapping is not a certification.`
    - Two links, labels `Control-evidence responsibility` and `Framework coverage`, hrefs:
      - `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md`
      - `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/FRAMEWORK_COVERAGE.md`
3. Add `page.tsx` and `SecureNowComplianceNotesPageView.tsx` under `archlucid-ui/src/app/(operator)/administration/securenow-compliance-notes/`. `data-testid="securenow-compliance-notes-page"`. Use `OperatorPageContainer` and `OperatorPageHeader`.
4. In `PRODUCT_LINE_EXTRA_ASSIGNMENTS`, set `"/administration/securenow-compliance-notes": "security"`.
5. Extend `product-line-catalog.test.ts`: allowed for `security`, refused for `architecture`.
6. Add a page test that finds `Not a certification`, `NO_GO`, both link labels, and the assurance duty.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-compliance-notes/SecureNowComplianceNotesPageView.test.tsx src/lib/product-line/product-line-catalog.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/security/SOC2_SELF_ASSESSMENT_2026.md` or `docs/security/COMPLIANCE_MATRIX.md`.
- Do not add a numeric compliance score, a marketing route, or a new audit-evidence API.
- Do not commit.

## Done when

A SecureNow operator can open the duty split and the coverage card from an administration page, and the page says it is not a certification.
