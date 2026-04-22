# Terraform — Azure Logic Apps (Standard)

Optional root for **Logic App Standard** hosts that subscribe to ArchLucid **integration events** on Service Bus (see `infra/terraform-servicebus/` and `docs/INTEGRATION_EVENTS_AND_WEBHOOKS.md`).

## Governance approval host (optional)

Set **`enable_governance_approval_logic_app = true`** to deploy a **second** Logic App (Standard) site intended for the **`governance-approval-routing`** workflow (Teams / Outlook fan-out → callbacks to `POST /v1/governance/...` approve/reject routes). Use outputs **`governance_logic_app_principal_id`** when wiring **`governance_logic_app_managed_identity_principal_id`** in `infra/terraform-servicebus` for the filtered subscription (see that root’s README).

Workflow JSON and connections are still authored in Portal or CI; placeholder notes live under [`workflows/governance-approval-routing/README.md`](workflows/governance-approval-routing/README.md).

## Marketplace fulfillment host (optional)

Set **`enable_marketplace_fulfillment_logic_app = true`** to deploy a dedicated Logic App (Standard) site for **`marketplace-fulfillment-handoff`** (separate WS1 plan + storage from the generic **`edge`** and **governance** hosts). Use output **`marketplace_fulfillment_logic_app_principal_id`** when wiring **`marketplace_fulfillment_logic_app_managed_identity_principal_id`** in `infra/terraform-servicebus` for the filtered **`com.archlucid.billing.marketplace.webhook.received.v1`** subscription (two-step apply: deploy this root first, then pass the principal id into Service Bus and re-apply).

Workflow notes: [`workflows/marketplace-fulfillment-handoff/README.md`](workflows/marketplace-fulfillment-handoff/README.md).

## Trial lifecycle email host (optional)

Set **`enable_trial_lifecycle_logic_app = true`** plus a unique **`trial_lifecycle_storage_account_name`**. Use **`trial_lifecycle_logic_app_principal_id`** in **`infra/terraform-servicebus`** as **`trial_lifecycle_logic_app_managed_identity_principal_id`** when **`enable_logic_app_trial_lifecycle_email_subscription`** is true. Pair with `ArchLucid:Notifications:TrialLifecycle:Owner=LogicApp` when the in-process scan is off — [`workflows/trial-lifecycle-email/README.md`](workflows/trial-lifecycle-email/README.md).

## Incident ChatOps host (optional)

Set **`enable_incident_chatops_logic_app = true`** plus **`incident_chatops_storage_account_name`**. Use **`incident_chatops_logic_app_principal_id`** as **`incident_chatops_logic_app_managed_identity_principal_id`** in Service Bus when **`enable_logic_app_incident_chatops_subscription`** is true — [`workflows/incident-chatops/README.md`](workflows/incident-chatops/README.md).

## Promotion customer notify host (optional)

Set **`enable_promotion_customer_notify_logic_app = true`** plus **`promotion_customer_notify_storage_account_name`**. Use **`promotion_customer_notify_logic_app_principal_id`** as **`promotion_customer_notify_logic_app_managed_identity_principal_id`** in Service Bus when **`enable_logic_app_promotion_prod_customer_subscription`** is true — [`workflows/promotion-customer-notifications/README.md`](workflows/promotion-customer-notifications/README.md).

## Microsoft Teams notifications host (optional)

Set **`enable_teams_notifications_logic_app = true`** plus **`teams_notifications_storage_account_name`**. Use **`teams_notifications_logic_app_principal_id`** when granting Service Bus **`Data Receiver`** and Key Vault secret **Get** to the managed identity. Workflow design notes: [`workflows/teams-notifications/README.md`](workflows/teams-notifications/README.md) — pairs with **`GET/POST/DELETE /v1/integrations/teams/connections`** (Key Vault secret *name* only in SQL).

## Other documented workflows (Portal / export)

- [`workflows/trial-lifecycle-email/README.md`](workflows/trial-lifecycle-email/README.md) — scheduled trial email; pair with `ArchLucid:Notifications:TrialLifecycle:Owner=LogicApp` when the API scan is off.
- [`workflows/incident-chatops/README.md`](workflows/incident-chatops/README.md) — alert fired / resolved to Teams or PagerDuty.
- [`workflows/promotion-customer-notifications/README.md`](workflows/promotion-customer-notifications/README.md) — prod-only promotion fan-out.
- [`workflows/marketplace-fulfillment-handoff/README.md`](workflows/marketplace-fulfillment-handoff/README.md) — **`com.archlucid.billing.marketplace.webhook.received.v1`** after API success (sales / CRM / Teams).

**Dedicated Terraform hosts (all optional, off by default):** **`edge`** (`enable_logic_apps`), **governance**, **Marketplace fulfillment**, **trial lifecycle email**, **incident ChatOps**, **promotion customer notify**, **Teams notifications** — each has its own WS1 plan, file share, and system-assigned identity for Service Bus RBAC. You can still run multiple workflows on **`edge`** only if you prefer fewer billable plans.

## When to enable

Set `enable_logic_apps = true` only after:

1. A resource group and region are chosen.
2. A **globally unique** `storage_account_name` is reserved (24 chars, lowercase alphanumeric).
3. VNet integration and private endpoints are planned per org policy (align with `infra/terraform-private/`; do not expose SMB publicly).

## Log Analytics diagnostics (optional)

Set **`enable_logic_app_diagnostic_settings = true`** and **`logic_app_diagnostic_log_analytics_workspace_id`** to the **full resource ID** of a Log Analytics workspace (same subscription or cross-subscription ID strings are accepted by Azure RM). Terraform then creates **`azurerm_monitor_diagnostic_setting`** for **each** Logic App Standard site that is actually deployed (`edge`, governance, Marketplace fulfillment, trial lifecycle, incident ChatOps, promotion customer notify, Teams notifications — whichever flags are true). Logs use the **`allLogs`** category group; metrics include **`AllMetrics`**. Workspace retention and export rules are **cost** and **compliance** levers owned by the platform team.

## Apply

```bash
cd infra/terraform-logicapps
terraform init
terraform plan -var="enable_logic_apps=false"
```

Workflow JSON and in-app connections are **not** defined here; export from the designer or CI and attach via storage share files per Microsoft guidance.

## Related

- `docs/CURSOR_PROMPTS_LOGIC_APPS.md` — implementation prompts for governance, trial email, marketplace, ChatOps, and customer notifications.
- `docs/adr/0019-logic-apps-standard-edge-orchestration.md` — architecture decision.
- `docs/runbooks/LOGIC_APPS_STANDARD.md` — operator notes.
- `docs/runbooks/LOGIC_APPS_INCIDENT_CHATOPS.md` — alert fired/resolved Service Bus user properties and callback routes.
