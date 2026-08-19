> **Reviewed:** 2026-07-27

> **Scope:** Path-stable CI alias for the sponsor claim / execution-mode label audit. Not an independent status tracker.

# Sponsor claim and execution-mode label audit (alias)

**Last reviewed:** 2026-07-27

**Canonical audit + claim readiness:** [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit).

Unsupported-Claim Audit results, execution mode labeling rules, ROI narrative claim gate surfaces, proof-language claim audit, and send/no-send hardening live only in claim readiness status. This file keeps the historical path stable for sponsor-evidence CI anchors and RC callers.

**Proof-language claim audit:** [`CLAIM_READINESS_STATUS.md#proof-language-claim-audit-static-buyer-docs`](CLAIM_READINESS_STATUS.md#proof-language-claim-audit-static-buyer-docs).

**Send/no-send hardening appendix:** [`CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16`](CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16).

### RC verification — Simulator ROI forbid regression (**TB-985**, 2026-08-10)

Cross-surface guards assert sponsor lead zones do not present annualized/projected USD on Simulator-only or **HOLD** postures per [`SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md`](../library/SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md).

```powershell
# Sponsor forbid anchors + label discipline (TB-983 / TB-985)
python scripts/ci/check_sponsor_evidence_label_consistency.py

# .NET cross-surface invariant tests (Simulator + HOLD lead-zone assertions)
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~SponsorSimulatorRoiForbidAssertions|FullyQualifiedName~First_value_report_simulator_mode|FullyQualifiedName~First_value_markdown_hold_disposition|FullyQualifiedName~Value_report_docx_hold"

# UI badge + buyer-trend suppression (TB-984 consumers; TB-985 Vitest regression)
cd archlucid-ui
npm run test -- pilot-proof-readiness.test.ts execution-mode-honesty.test.ts EmailRunToSponsorBanner.test.tsx
```

**TB-985 honesty CI:** cross-surface Simulator/HOLD USD regression guards — `SponsorSimulatorRoiForbidAssertions`, `check_sponsor_evidence_label_consistency.py` (`simulator-roi-forbid` anchors), Vitest `execution-mode-honesty.test.ts` / `pilot-proof-readiness.test.ts`. Canonical contract: [`SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md`](../library/SIMULATOR_ROI_SPONSOR_FORBID_CONTRACT.md).
