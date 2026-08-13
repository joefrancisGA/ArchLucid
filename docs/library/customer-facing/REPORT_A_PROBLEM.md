# Report a problem

When a core workflow fails — for example a review that will not load, a governance queue error, or an API problem with a correlation id — use **Report problem** on the page. It is the fastest way to send structured context to ArchLucid support.

Email remains available when you are not on an in-product error surface: use **[support@archlucid.net](mailto:support@archlucid.net)**. Prefer [Troubleshooting](/help/troubleshooting) before escalating when the failure is still recoverable.

## What happens when you submit {#what-happens}

1. Review the diagnostic details ArchLucid can share (review id, workspace, product version, correlation id, route, and error title when available).
2. Add an optional short note — avoid secrets, tokens, or customer PII.
3. Confirm consent before submit.
4. Receive a **report reference** id in the dialog and by email (when your account has a mailbox on file).
5. ArchLucid acknowledges receipt with the support commitment (effective **2026-07-15**; see [Security and trust](/help/security-trust)): **we respond by the next business day** — not immediate chat and not always-on live monitoring.

## What we capture (with your consent) {#captured-fields}

| Field | Purpose |
| --- | --- |
| Review id | Tie the report to an architecture review when you were on a review route |
| Workspace id | Active workspace scope |
| Tenant id | Organization scope (never shared across tenants) |
| Product version | API and UI build identifiers |
| Browser summary | Short client summary — not a full diagnostic export |
| Correlation id / client request id | Tie your attempt to server-side diagnostics |
| Route | Page path where you clicked Report problem |
| Error code / title | HTTP status or failure headline when available |
| Your note | Optional context you provide |

## What we never capture silently {#never-capture}

Report problem does **not** auto-attach:

- Raw browser console or client diagnostic buffers
- Prompts, model inputs, or LLM traces
- Evidence bodies, architecture uploads, or finding payloads
- Secrets, tokens, or connection strings

## Optional redacted support bundle {#support-bundle}

You may opt in per report to attach a **redacted support bundle** (build, health, and config summaries). You can also download a bundle later from **Administration → Support** (`/administration/support`, administrators only — ask your workspace administrator, or attach the bundle at report time) when support requests diagnostics.

## Where Report problem appears {#where-it-appears}

Report problem is limited to **high-stakes failures** — not empty states, field validation toasts, or marketing pages. The in-product registry of surfaces is listed on this help page below the Sources strip. Validation-only HTTP 400 responses (field validation) are excluded from Report problem unless the registry is expanded.

## Related topics {#related-topics}

- [Troubleshooting](/help/troubleshooting) — try fixes before escalating
- [Administration → Support](/administration/support) — download a support bundle and email templates (administrators only)
- [Security and trust](/help/security-trust) — assurance and data-handling posture
