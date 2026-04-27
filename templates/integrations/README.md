# Integration templates

Recipes and offline validation helpers for outbound integration events.

| Recipe | Validation script |
|--------|-------------------|
| [jira/jira-webhook-bridge-recipe.md](jira/jira-webhook-bridge-recipe.md) | [`validate-jira-bridge.ps1`](validate-jira-bridge.ps1) |
| [servicenow/servicenow-incident-recipe.md](servicenow/servicenow-incident-recipe.md) | [`validate-servicenow-bridge.ps1`](validate-servicenow-bridge.ps1) |

**Event catalog (schemas):** [schemas/integration-events/catalog.json](../../schemas/integration-events/catalog.json)

Run both scripts from the repository root (PowerShell 7+). They only assert payload and HMAC construction — **no** calls to Jira, ServiceNow, or ArchLucid SaaS endpoints.
