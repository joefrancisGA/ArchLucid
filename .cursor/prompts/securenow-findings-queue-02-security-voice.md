# SN-FQ-02 — SecureNow findings header uses security voice

**Wave:** SecureNow findings queue (**SN-FQ**). **Depends on:** SN-FQ-01. **Branch:** `cursor/sn-fq-security-voice`

## Goal

After inhabit is off, `/compliance/findings` still reads as an architecture risk register. Give the Security shell its own findings title, subtitle, claim, layer guidance, and capability boundary.

## Why

`GovernanceFindingsQueueHeader` always uses `LayerHeader pageKey="governance-findings"`. That block and `layerHeaderEnterpriseOperatorRankLine` say “Track architecture risks…” and “Approval controls record who submitted, reviewed, and approved architecture reviews…”. Page title falls back to **Architecture** only while inhabited; the non-inhabited title and subtitle are still the architecture risk register. SecureNow strings already exist and are unused on this page: `SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE` and `SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE`. Job-router lines for Assigned to me and Record decisions already branch; Process approvals and Triage findings can stay shared if their sentences do not say “architecture review”.

## Read first

- `docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/lib/layer-guidance.ts` (`governance-findings`)
- `archlucid-ui/src/lib/enterprise-controls-context-copy-governance.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/governance-findings-queue-presentation.ts`
- `archlucid-ui/src/lib/findings/findings-help-guide-content.ts` (`SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE`)
- `archlucid-ui/src/lib/product-line/securenow-governance-assigned-to-me-copy.ts`
- `archlucid-ui/src/lib/page-capability-boundary.ts` (`PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS`)

## What to build

1. Security findings page title is **Findings** (the existing nav label). Never **Architecture**.
2. Security subtitle is `SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE`. Security claim is `SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE`. Wire those through `resolveGovernanceFindingsPageSubtitle` and `resolveGovernanceFindingsClaimDiscipline` when the product line is Security and the mode is the tenant queue. Do not change Architecture copy.
3. Security layer guidance for this page: badge **Findings**; headline and use-when describe ARC-AMPE and cloud-inventory findings, owners, and evidence. No “architecture risks”, “architecture reviews”, or “sealed review record”. Branch in the guidance resolver or pass a Security block from the header. Do not edit the Architecture `governance-findings` strings.
4. Replace the operator rank line on this page for Security so it does not say architecture reviews were submitted and approved. One sentence about audit lineage for security findings is enough.
5. Security capability-boundary items for `governanceFindings`: no automatic remediation, no policy-pack authoring, no invented findings, no replacing the decision register. Do not say finalized architecture review record. Architecture boundary text stays.
6. Vitest the Security strings and assert the Architecture layer-guidance block is unchanged.

## Do not

- Reintroduce inhabit chrome.
- Edit help-guide bodies except to import the existing subtitle constant.
- Collapse nav tabs.

## Done when

A Security Working render of `/compliance/findings` shows **Findings**, the SecureNow subtitle and claim, and none of the architecture-review layer sentences. Architecture `/governance/findings` copy is unchanged.
