# Workflow `incident-chatops` (placeholder)

**Objective:** Route `com.archlucid.alert.fired` and `com.archlucid.alert.resolved` to Teams / PagerDuty with adaptive cards whose actions call **existing** ArchLucid alert APIs (acknowledge / mute / suppress), avoiding feedback loops into new alert events.

**Service Bus:** enable `enable_logic_app_incident_chatops_subscription` in `infra/terraform-servicebus/` — the default rule delivers **either** fired **or** resolved events on one subscription.

**Security:** use managed identity + APIM or private ingress for callback HTTP; never embed long-lived secrets in workflow definitions (Key Vault references only).

**Still out of repo:** `workflow.json`, connector bindings, and correlation keys for updating Teams cards on resolve (see `docs/adr/0008-alert-dedupe-scopes.md`).
