# Azure Marketplace — SaaS offer (fulfillment v2) checklist

## Objective

Stand up a **transactable** SaaS offer that lands buyers in ArchLucid while using **managed identity** to call **`https://marketplaceapi.microsoft.com/.default`** for subscription activation.

## Step-by-step (operator)

1. **Partner Center** → Commercial Marketplace → New offer → **Software as a Service**.
2. **Plan IDs** align with ArchLucid commercial tiers (`Team`, `Pro`, `Enterprise`) or map in your landing page.
3. **Technical configuration**
   - **Landing page URL:** the URL returned from `Billing:AzureMarketplace:LandingPageUrl` (must accept `tenantId`, `workspaceId`, `projectId`, `tier`, `session` query parameters from ArchLucid checkout).
   - **Webhook URL:** `https://<api-host>/v1/billing/webhooks/marketplace`
   - **Azure AD tenant ID** for the webhook app registration (Microsoft validates JWTs against OIDC metadata).
4. **ArchLucid configuration**
   - `Billing:Provider=AzureMarketplace`
   - `Billing:AzureMarketplace:OpenIdMetadataAddress` (typically `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration` or a tenant-specific metadata URL)
   - `Billing:AzureMarketplace:ValidAudiences` includes `https://marketplaceapi.microsoft.com`
   - `Billing:AzureMarketplace:FulfillmentApiEnabled=true` in production (set `false` only in isolated tests without network).
5. **Managed identity**
   - Grant the API’s user-assigned or system MI permission to call Marketplace fulfillment APIs per Microsoft guidance.

## Webhook actions (implemented subset)

| Marketplace `action` | ArchLucid behavior |
|----------------------|--------------------|
| `Subscribe` / `Purchase` | Optional HTTP **activate** (when enabled) + `TenantTrialConverted` path |
| `Suspend` | `sp_Billing_Suspend` |
| `Reinstate` | `sp_Billing_Reinstate` |
| `Unsubscribe` | `sp_Billing_Cancel` |
| `ChangePlan` / `ChangeQuantity` | Acknowledged (no-op today; extend in product backlog) |

## Related

- **`docs/BILLING.md`**
- **`docs/adr/0016-billing-provider-abstraction.md`**
