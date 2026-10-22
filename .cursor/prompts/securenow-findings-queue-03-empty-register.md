# SN-FQ-03 — Empty SecureNow findings register stays empty

**Wave:** SecureNow findings queue (**SN-FQ**). **Depends on:** SN-FQ-01. **Branch:** `cursor/sn-fq-empty-register`

## Goal

A SecureNow findings queue with zero register rows is a successful empty queue. It must not call ArchLucid review listing, and it must not show Working-recovery or **Open architecture desk**.

## Why

`fetchGovernanceFindingQueueRows` loads the risk and decision registers. When both are empty it calls `listRunsByProjectPaged("default")` (`GET /v1/authority/projects/default/reviews`) and explanation summaries. Any throw becomes `loadFailed: true`. On an inhabited document that paints **Findings load failed** and the live Working recovery body. SecureNow has no architecture-review project named `default`. An empty policy-findings register is a normal state.

## Read first

- `docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/components/governance/findings/governance-findings-query-fetch.ts`
- `archlucid-ui/src/components/governance/findings/use-governance-findings-query.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx`
- `archlucid-ui/src/lib/architecture/architecture-risk-register-copy.ts` (Architecture empty copy — do not reuse it on Security)

## What to build

1. Pass product line into the tenant findings fetch. When the product line is Security and `fetchGovernanceFindingsRegistersBundle` returns zero rows, return `{ rows: [], loadFailed: false, failure: null }`. Do not call `listRunsByProjectPaged` or `getRunExplanationSummary`.
2. Architecture product line keeps the current empty-register fallback.
3. When the Security registers bundle throws, keep `loadFailed: true` and the existing non-inhabit findings error preset. Do not use `INHABIT_FINDINGS_LIVE_RECOVERY_*` or an architecture-desk action.
4. Security empty copy: title and body say no cloud security findings are in this workspace yet, and point at policy packs. No “this review”, no quiet engines, no Practice runs, no sample packages. Put the strings in a Security copy module; do not overwrite `ARCHITECTURE_RISK_REGISTER_EMPTY_*`.
5. Vitest: Security + empty registers → `loadFailed` false and `listRunsByProjectPaged` not called. Security + register throw → `loadFailed` true and no architecture-desk action. Architecture + empty registers still calls the review fallback.

## Do not

- Change register API routes.
- Treat a thrown register request as an empty queue.
- Start **SN-FQ-02** copy work beyond the empty-state strings.

## Done when

Those three fetch cases pass, and a Security empty queue does not mention architecture desks, Working recovery, or sample intake.
