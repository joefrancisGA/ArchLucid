> **Scope:** Paste-ready prompts to finish SecureNow page **H1** alignment with `SECURENOW_NAV_LABELS`. No breadcrumb UI in this wave. Internal engineering only. Prompts only — do not implement from this index. Run every prompt on Composer 2.5 slow (`composer-2.5`), not a fast-tier slug.
> **Paste-ready files:** [`.cursor/prompts/securenow-nav-page-headings-00-index.md`](../../.cursor/prompts/securenow-nav-page-headings-00-index.md)

# SecureNow nav page headings — Luna prompts

**Created:** 2026-10-16 · **Status:** ready to paste · **Audience:** Composer 2.5 slow (`composer-2.5`)

**SN-HOME-05** shipped sidebar wrapping and `getRouteTitle` lookup for the security shell. Trunk also has `resolveSecureNowPageHeading` and partial adoption on several governance workbenches. Remaining pages still branch on `productLine === "security"` and read `SECURENOW_NAV_LABELS[...]` inline, which drifts from the sidebar when labels change.

Paste **one** prompt per session. Run **SN-NPH-01** before **SN-NPH-02**.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-NPH-01** | [securenow-nav-page-headings-01-workbench-headings.md](../../.cursor/prompts/securenow-nav-page-headings-01-workbench-headings.md) | — | Unit-test the helper; replace inline SecureNow title ternaries on infrastructure and security workbench clients |
| **SN-NPH-02** | [securenow-nav-page-headings-02-secondary-chrome.md](../../.cursor/prompts/securenow-nav-page-headings-02-secondary-chrome.md) | SN-NPH-01 | Findings queue, remediation patterns, collection agent page titles — same labels as the sidebar. No breadcrumbs. |
| **SN-NPH-HOLD** | [securenow-nav-page-headings-hold.md](../../.cursor/prompts/securenow-nav-page-headings-hold.md) | — | Forbidden scope |

## Settled reading

- **One map:** `SECURENOW_NAV_LABELS` is the SecureNow sidebar label. Page **H1** (and `getRouteTitle` announcements) use that string via `resolveSecureNowPageHeading`. Breadcrumb trails are not product chrome for SecureNow.
- **Architecture unchanged:** When `productLineId !== "security"`, titles stay on existing `GOVERNANCE_*` / `OPERATOR_NAV_LINK_LABELS` constants.
- **`getRouteTitle` already prefers `SECURENOW_NAV_LABELS` on the security shell.** This wave is in-page chrome, not a second title system.
- **Do not rename hrefs** or change `SECURENOW_NAV_LABELS` copy in these sessions unless a test proves a mismatch with an already-shipped sidebar label.

## Related

- **SN-HOME-05** — sidebar wrap + route title lookup ([`SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`](SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md))
- **SN-MENU-02** — menu labels and titles ([`SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`](SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md))
