<!-- SecureNow nav page headings — Luna prompts.
     Origin: 2026-10-16 branch cursor/securenow-nav-page-headings-4156.
     Finish H1 alignment with SECURENOW_NAV_LABELS via resolveSecureNowPageHeading (no breadcrumb work).
     Do not implement from this index. -->

# SecureNow nav page headings — prompt set (SN-NPH-01–02)

Paste **one** numbered file per session, in order. Every prompt runs on Composer 2.5 slow (`composer-2.5`).

Copy-paste docs index: [`docs/architecture/SECURENOW_NAV_PAGE_HEADINGS_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_NAV_PAGE_HEADINGS_LUNA_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-NPH-01** | `securenow-page-heading` tests; workbench clients use `resolveSecureNowPageHeading` instead of inline `SECURENOW_NAV_LABELS` ternaries |
| 2 | **SN-NPH-02** | Secondary page titles only (findings queue, remediation patterns, collection agent). No breadcrumbs. |
| — | **SN-NPH-HOLD** | Stop list. Paste only when a session drifts. |

**SN-NPH-HOLD** is not a build step.
