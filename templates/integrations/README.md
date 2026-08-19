# Integration templates

Recipes and offline validation helpers for outbound integration events.

| Recipe | Validation script |
|--------|-------------------|
| [jira/jira-webhook-bridge-recipe.md](jira/jira-webhook-bridge-recipe.md) | [`validate-jira-bridge.ps1`](validate-jira-bridge.ps1) |
| [servicenow/servicenow-incident-recipe.md](servicenow/servicenow-incident-recipe.md) | [`validate-servicenow-bridge.ps1`](validate-servicenow-bridge.ps1) |
| Fixture → mapping parity (starter kit; Node built-in **`--test`**) | [`bridge-recipe-contract-tests/README.md`](bridge-recipe-contract-tests/README.md) |

**Event catalog (schemas):** [schemas/integration-events/catalog.json](../../schemas/integration-events/catalog.json)

**Event delivery & webhooks (operator):** [docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)

Run the PowerShell validators and **`node --test templates/integrations/bridge-recipe-contract-tests/mapping-contract.test.mjs`** from the repository root (**PowerShell** 7+ for scripts; Node 22+ for the starter contract harness). Scripts only assert payload and HMAC construction — **no** calls to Jira, ServiceNow, or ArchLucid SaaS endpoints.