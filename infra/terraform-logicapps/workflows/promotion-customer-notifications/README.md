# Workflow `promotion-customer-notifications` (placeholder)

**Objective:** On production governance promotion (`com.archlucid.governance.promotion.activated` with user property `promotion_environment = prod`), fan out customer-facing email, Teams, and signed webhooks in parallel branches.

**Service Bus:** enable `enable_logic_app_promotion_prod_customer_subscription` in `infra/terraform-servicebus/`. The API and outbox processor set **`promotion_environment`** on the message from the JSON `environment` field so SQL filters work without parsing the body.

**Channel preferences (API):** `GET /v1/notifications/customer-channel-preferences` — see `CustomerNotificationChannelPreferencesController` and contract `TenantNotificationChannelPreferencesResponse`. **.NET client:** `ArchLucidApiClient.CustomerChannelPreferencesAsync()` (regenerate via `dotnet build` on `ArchLucid.Api.Client` after OpenAPI snapshot updates).

**Still out of repo:** `workflow.json` and HMAC signing steps with `secureInput` / `secureOutput` (design in Portal / your CD pipeline).
