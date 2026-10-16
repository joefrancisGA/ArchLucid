> **Scope:** Paste-ready Luna prompts for engineer-to-analyst handoff gaps 4 and 5. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/securenow-handoff-00-index.md`](../../.cursor/prompts/securenow-handoff-00-index.md), [SN-HAND-05](../../.cursor/prompts/securenow-handoff-05-association-table.md) through [SN-HAND-08](../../.cursor/prompts/securenow-handoff-08-association-ui.md), [SN-HAND-09](../../.cursor/prompts/securenow-handoff-09-latest-attempt.md), [SN-HAND-10](../../.cursor/prompts/securenow-handoff-10-latest-attempt-ui.md), [SN-HAND-HOLD](../../.cursor/prompts/securenow-handoff-hold.md).

# Engineer-to-analyst handoff — Luna prompts

**Created:** 2026-10-12 · **Updated:** 2026-10-14 · **Status:** gaps 4–5 **shipped** on trunk (**SN-HAND-05–10**). Prompt files remain for regression reference; do not re-run as greenfield. **Audience:** Composer 2.5 slow

Paste **one** prompt per session. Do not implement from this index.

Source: [`docs/securenow/ENGINEER_ANALYST_HANDOFF.md`](../securenow/ENGINEER_ANALYST_HANDOFF.md). SN-HAND-01 is the design note. SN-HAND-05–08 add the verified association row. SN-HAND-09–10 add the latest attempt when that row is absent.

| ID | Prompt | Intent |
|----|--------|--------|
| **SN-HAND-05** | [securenow-handoff-05-association-table.md](../../.cursor/prompts/securenow-handoff-05-association-table.md) | Table and repository. Identifiers only. |
| **SN-HAND-06** | [securenow-handoff-06-write-on-verified.md](../../.cursor/prompts/securenow-handoff-06-write-on-verified.md) | Write the row when verification passes and both ids are present. |
| **SN-HAND-07** | [securenow-handoff-07-lineage-read.md](../../.cursor/prompts/securenow-handoff-07-lineage-read.md) | Existing lineage read returns matching rows. No score. |
| **SN-HAND-08** | [securenow-handoff-08-association-ui.md](../../.cursor/prompts/securenow-handoff-08-association-ui.md) | Show the row on Audit evidence and Remediation tracker. |
| **SN-HAND-09** | [securenow-handoff-09-latest-attempt.md](../../.cursor/prompts/securenow-handoff-09-latest-attempt.md) | Gap 4. Lineage returns one latest attempt when `ControlId` matches and the instance is not already in `verifiedRemediationAssociations`. |
| **SN-HAND-10** | [securenow-handoff-10-latest-attempt-ui.md](../../.cursor/prompts/securenow-handoff-10-latest-attempt-ui.md) | Gap 4. Audit evidence shows that attempt. No checkbox change. |
| **SN-HAND-HOLD** | [securenow-handoff-hold.md](../../.cursor/prompts/securenow-handoff-hold.md) | No second evidence store, no AI disposition, no gap 4 inside 05–08, no Azure apply. |

## Run order

Historical run order was **05 → 06 → 07 → 08**, then gap 4 as **09 → 10**. All are on trunk. Use scoped bugfix rows only; do not run two prompts in one session when extending behavior.

## How to check

Restart the API after SN-HAND-06 and SN-HAND-07. Restart the UI after SN-HAND-08. Hard-refresh Audit evidence lineage and Remediation tracker.

| After | What you should see |
|-------|---------------------|
| **SN-HAND-05** | No page change. Contract tests cover insert, idempotent rewrite, a second snapshot, and another tenant. |
| **SN-HAND-06** | A passed check with a control id and a verification snapshot id adds the row to instance detail. A failed check does not. |
| **SN-HAND-07** | Lineage for that control and a linked inventory snapshot lists the association. `ReadyForPositiveCheckbox` stays as it was. |
| **SN-HAND-08** | Audit evidence links to the remediation instance. The instance shows the control id and the verification snapshot id. The positive checkbox is unchanged. |
| **SN-HAND-09** | Lineage adds `latestRemediationAttempt` or `null`. No page change. |
| **SN-HAND-10** | Audit evidence shows `Latest remediation attempt` with the status label and a Remediation tracker link. The positive checkbox is unchanged. |

## Not in this set

- Gaps 1–3 (My findings control text, the remediation audit-evidence link, the Home checks-failed filter) — **already on trunk**; see `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` § Implementation status.
- Do not fold gap 4 into SN-HAND-05–08. Gap 4 shipped as **SN-HAND-09**, then **SN-HAND-10**.
- A copy of snapshot bytes or verification JSON
- A model marking a control evidenced
- A second findings list, a hidden review tab, or an Azure write

## Concerns

- **Security.** Every query stays in tenant, workspace, and project scope. No row-level security. No customer Azure write.
- **Scale.** One identifier row per verified instance, snapshot, and control. Lineage returns only the matches for that control and its linked inventory snapshots.
- **Reliability.** Verify fails closed when both ids are present and the association write fails. A missing control id still allows verify. A missing inventory link returns an empty lineage list.
- **Cost.** The row stores ids and timestamps. It does not store a second copy of the snapshot.
