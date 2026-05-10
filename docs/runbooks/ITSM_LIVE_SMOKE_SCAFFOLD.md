> **Scope:** TB-016 scaffold — how to add **live vendor** smoke coverage for first-party ITSM/chat connectors without checking long-lived secrets into git.

# ITSM connector live smoke (scaffold)

## Goal

Validate **Jira Cloud**, **ServiceNow developer**, **Slack**, and **Confluence Cloud** paths against real sandbox endpoints on a **scheduled** or **manually dispatched** workflow, with credentials stored in **GitHub Actions secrets** (or equivalent vault).

## Suggested layout

1. **Secrets (examples):** `ITSM_JIRA_BASE_URL`, `ITSM_JIRA_USER`, `ITSM_JIRA_TOKEN`, `ITSM_SN_INSTANCE`, `ITSM_SN_USER`, `ITSM_SN_PASSWORD`, `ITSM_SLACK_BOT_TOKEN`, `ITSM_CONFLUENCE_BASE_URL`, `ITSM_CONFLUENCE_USER`, `ITSM_CONFLUENCE_TOKEN`.
2. **Workflow:** `.github/workflows/itsm-live-smoke.yml` — `workflow_dispatch` + optional `schedule: cron weekly` — **continue-on-error: true** until the team declares merge-blocking.
3. **Test project:** thin `ArchLucid.Integrations.Itsm.LiveSmoke.Tests` (or reuse integration suite) that skips when secrets absent: `[SkippableFact]` pattern.
4. **Correlation:** fixed `X-Correlation-ID` prefix `itsm-live-smoke-` for log triage.

## Safety

- Sandboxes only; never production tenant admin keys.
- Rotate tokens on the same cadence as vendor trial resets.
- Redact tenant names in CI logs (existing `LogSanitizer` patterns where applicable).

## Related

- [`docs/library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) TB-016
- [`docs/library/API_CONTRACTS.md`](../library/API_CONTRACTS.md) ITSM routes
