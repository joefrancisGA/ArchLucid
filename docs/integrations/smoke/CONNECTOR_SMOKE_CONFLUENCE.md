> **Scope:** Smoke validation — Confluence page publish (MVP).

# Smoke — Confluence publish

## Prerequisites

- Confluence Cloud **space key** configured in host settings (`Confluence:DefaultSpaceKey` pattern).
- API token / basic credentials stored in **Key Vault** per tenant connector configuration.

## Happy path (operator)

1. Select a committed run with findings suitable for a pilot page (non-prod space).
2. Execute the **publish to Confluence** action from the operator UI or API surface shipped in your build (see OpenAPI).

## Verification

- **Confluence:** page created or updated under expected space; body references run id / summary.
- **Audit:** publish attempt logged with success/failure and retry-safe identifiers.

## Troubleshooting

- **401/403:** token scopes or IP allow list on Atlassian cloud.
- **Space missing:** fix `DefaultSpaceKey`; never publish to production wiki spaces during smoke.
