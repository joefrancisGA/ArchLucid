> **Scope:** Operator runbook for migrating first-party ITSM and Confluence connectors from basic auth / API tokens to OAuth 2.0 (TB-600).

# ITSM and Confluence OAuth migration runbook

## When to use

Use this runbook when a buyer or internal security review requires OAuth instead of basic auth or API tokens for:

- Tenant-scoped **Jira** or **ServiceNow** connections (`TenantItsmConnectorConnections`)
- Deployment-wide **Jira** / **ServiceNow** fallbacks (`Integrations:ItsmOutbound`)
- Deployment-wide **Confluence** publish (`Integrations:ConfluencePublishing`)

`BasicApiToken` remains the default; existing connections continue working until you change `AuthMode`.

## Supported auth modes

| Mode | Jira (tenant + deployment) | ServiceNow (tenant + deployment) | Confluence publish |
| --- | --- | --- | --- |
| `BasicApiToken` | Email + API token | Username + password | Email + API token |
| `OAuth2RefreshToken` | Atlassian 3LO refresh token | — | Atlassian 3LO refresh token |
| `OAuth2ClientCredentials` | — | ServiceNow `oauth_token.do` | — |

## Tenant-scoped ITSM (hosted multi-tenant SaaS)

1. Apply migration `268_TenantItsmConnectorConnections_OAuthAuthMode.sql` (or deploy a build that includes it).
2. Store OAuth secrets in Key Vault (secret **names** only in SQL):
   - `OAuthClientIdKeyVaultSecretName`
   - `OAuthClientSecretKeyVaultSecretName`
   - `OAuthRefreshTokenKeyVaultSecretName` (Atlassian refresh-token mode only)
3. `PUT /v1/integrations/itsm/connections/{provider}` with:
   - `authMode`: `OAuth2RefreshToken` (Jira) or `OAuth2ClientCredentials` (ServiceNow)
   - OAuth KV secret name fields (and existing `instanceBaseUrl`)
4. Run the connector health probe from **Integration status** or `scripts/integrations/validate-itsm-connectors-live.ps1`.
5. Roll back by setting `authMode` back to `BasicApiToken` and restoring basic KV secret names — no data loss.

## Deployment-wide ITSM fallback (single-tenant / pilot)

When `Integrations:ItsmOutbound:RequireTenantScopedCredentials` is `false`:

```json
"Integrations": {
  "ItsmOutbound": {
    "Jira": {
      "CloudBaseUrl": "https://your-site.atlassian.net",
      "AuthMode": "OAuth2RefreshToken",
      "OAuthClientId": "<from Key Vault reference>",
      "OAuthClientSecret": "<from Key Vault reference>",
      "OAuthRefreshToken": "<from Key Vault reference>"
    },
    "ServiceNow": {
      "InstanceBaseUrl": "https://your-instance.service-now.com",
      "AuthMode": "OAuth2ClientCredentials",
      "OAuthClientId": "<client id>",
      "OAuthClientSecret": "<client secret>"
    }
  }
}
```

Restart API replicas after configuration change so token cache and options reload.

## Confluence publish (admin first-value report)

```json
"Integrations": {
  "ConfluencePublishing": {
    "Enabled": true,
    "CloudBaseUrl": "https://your-site.atlassian.net",
    "SpaceKey": "DOC",
    "AuthMode": "OAuth2RefreshToken",
    "OAuthClientId": "<from Key Vault reference>",
    "OAuthClientSecret": "<from Key Vault reference>",
    "OAuthRefreshToken": "<from Key Vault reference>"
  }
}
```

Smoke: `docs/integrations/smoke/CONNECTOR_SMOKE_CONFLUENCE.md` — expect `Integration.ConfluenceFirstValueReportPublished` on success.

## Atlassian refresh token acquisition (operator-assisted)

TB-600 does **not** yet ship an in-product auth-code consent UI. Until that UI lands:

1. Create an OAuth 2.0 (3LO) app in the [Atlassian developer console](https://developer.atlassian.com/).
2. Complete the authorization code flow once using Atlassian's documented tool or a secure internal script.
3. Store the **refresh token** in Key Vault; never commit it to git or operator tickets.
4. Map the refresh token secret into `OAuthRefreshToken` (deployment) or `OAuthRefreshTokenKeyVaultSecretName` (tenant row).

## Verification checklist

- [ ] Outbound Jira issue create succeeds (or health probe passes).
- [ ] Outbound ServiceNow incident create succeeds (or health probe passes).
- [ ] Confluence first-value publish returns `200` with `externalPageId`.
- [ ] Audit events do not contain raw tokens (only external ids / run ids).
- [ ] Rollback path tested in non-production.

## Security notes

- Least privilege: request only scopes required for issue/incident create and Confluence page create.
- Rotate client secrets per vendor policy; update Key Vault references and restart workers if needed.
- `RequireTenantScopedCredentials: true` (recommended for SaaS) ignores deployment-wide credential blocks.

## Related docs

- `docs/go-to-market/INTEGRATION_CATALOG.md`
- `docs/library/CONFIGURATION_REFERENCE.md`
- `docs/integrations/smoke/CONNECTOR_SMOKE_INDEX.md`
