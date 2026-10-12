<!-- SecureNow menu and editions — Luna prompts.
     Origin: 2026-10-10 owner Q&A on SecureNow menu organization, editions,
     compliance scope, collection path, and in-tenant deployment.
     Do not implement from this index. -->

# SecureNow menu and editions — prompt set (SN-MENU, SN-ED, SN-PACK, SN-COL, SN-DEP, SN-HAND)

Paste **one** numbered file per session, in wave order. Every prompt runs on Composer 2.5 slow (`composer-2.5`).

Copy-paste docs index: [`docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-MENU-01** | Home stands alone. Findings, Environment, Remediation, Compliance, Data sources, Integrations groups. |
| 2 | **SN-MENU-02** | New labels in sentence case. Titles and breadcrumbs match. |
| 3 | **SN-MENU-03** | Tooltips and captions use security wording. |
| 4 | **SN-MENU-04** | Home follows the menu. Posture strip superseded by SN-HOME-02 and SN-HOME-03. |
| 5 | **SN-ED-01** | `generic` or `uhg` edition from deployment config. |
| 6 | **SN-ED-02** | Branding per edition. Leak guard per edition. |
| 7 | **SN-ED-03** | Featured frameworks per edition. |
| 8 | **SN-ED-04** | Edition nav overlay seam. Ships empty. |
| 9 | **SN-PACK-01** | NIST SP 800-53 Rev. 5 pack. |
| 10 | **SN-PACK-02** | OWASP ASVS pack. |
| 11 | **SN-PACK-03** | Microsoft cloud security benchmark pack. |
| 12 | **SN-PACK-04** | Organization policy and architecture pack starter. |
| 13 | **SN-COL-01** | ADR: in-tenant collection agent and blob handoff. |
| 14 | **SN-COL-02** | Collection run records and blob ingest. |
| 15 | **SN-COL-03** | Collection agent page. |
| 16 | **SN-COL-04** | Run now and schedule. |
| 17 | **SN-DEP-01** | ADR 0104: in-tenant SecureNow deployment. Accepted 2026-10-12. |
| 18 | **SN-DEP-02** | In-tenant Terraform root. |
| 19 | **SN-DEP-03** | In-tenant Administration variant. |
| 20 | **SN-HAND-01** | Design note: engineer-to-analyst handoff. |
| — | **SN-MENU-HOLD** | Stop list. Paste only when a session drifts. |

Gap 5 implementation is a later set: [securenow-handoff-00-index.md](securenow-handoff-00-index.md) (**SN-HAND-05–SN-HAND-08**). Do not paste it from this menu index.

**SN-MENU-HOLD** is not a build step. The owner accepted SN-COL-01 (ADR 0103) on 2026-10-11, and SN-COL-02 is on `master`. The owner accepted SN-DEP-01 (ADR 0104) on 2026-10-12. SN-DEP-02 and SN-DEP-03 may proceed when those prompts are run.
