# SN-HAND-HOLD — Stop list for the gap 5 association

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a gap 5 session starts to drift. This is not a build step.

## Stop

- Do not copy snapshot bytes, `AuditEvidenceSnapshotItems`, or `VerificationResultJson` into the association table or a second evidence store.
- Do not change `ReadyForPositiveCheckbox`, `ChainComplete`, evaluation outcome, or human disposition because an association exists.
- Do not let a model mark a control evidenced. The association is an identifier row. A person records the disposition.
- Do not implement gap 4 in an SN-HAND-05–08 session. Gap 4 is [SN-HAND-09](securenow-handoff-09-latest-attempt.md) and [SN-HAND-10](securenow-handoff-10-latest-attempt-ui.md): one latest attempt when `ControlId` matches and that instance is not already in `verifiedRemediationAssociations`.
- Do not re-implement gaps 1–3 (My findings control text, the remediation audit-evidence link, the Home checks-failed filter).
- Do not add a second findings list.
- Do not hide a review workspace tab behind a More menu.
- Do not add a tenant-wide sealed decision list or a diagram-document table.
- Do not write to Azure, change ARM, or run `terraform apply`.
- Do not add SQL row-level security.
- Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or assurance **TB-135 / TB-136**.

## Still in the set

SN-HAND-05 table, SN-HAND-06 write on `Verified`, SN-HAND-07 lineage read, SN-HAND-08 the two pages.
