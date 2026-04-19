# Workflow `promotion-customer-notifications` (placeholder)

**Objective:** On production governance promotion (`com.archlucid.governance.promotion.activated` with user property `promotion_environment = prod`), fan out customer-facing email, Teams, and signed webhooks in parallel branches.

**Service Bus:** enable `enable_logic_app_promotion_prod_customer_subscription` in `infra/terraform-servicebus/`. The API and outbox processor set **`promotion_environment`** on the message from the JSON `environment` field so SQL filters work without parsing the body.

**Still out of repo:** internal channel-preferences API client, `workflow.json`, and HMAC signing steps with `secureInput` / `secureOutput`.
