> **Scope:** Smoke validation — Jira issue export / sync (MVP).

# Smoke — Jira issue

## Prerequisites

- Jira Cloud (or documented on-prem variant if your fork supports it) with API token / OAuth per [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md).
- Secrets only in **Key Vault** (or approved secret store) — reference secret **names** from ArchLucid tenant config, not raw tokens in docs.

## Happy path (operator)

1. Ensure a committed run includes at least one actionable finding.
2. Create/push a **Jira issue** from the finding using the in-product control or API (see OpenAPI in your build).

## Verification

- **Jira:** issue description/body links back to ArchLucid identifiers (run id, finding id).
- **Audit:** outbound attempt recorded; failures include HTTP status for support triage.

## Troubleshooting

- **Field mapping errors:** confirm required custom fields for pilot project; retry after project admin fixes.
- **Bi-directional sync:** treat status sync as best-effort until green in pilot tenant — see catalog for committed scope.
