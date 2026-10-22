# AX-DE-18 — Redacted App Service setting hosts (Tier 1 only)

**Wave:** AX-DE. **Depends on:** AX-DE-01. **Last.** Requires trust-center / RBAC copy in the same PR.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Optional Tier 1 switch (e.g. `-IncludeAppSettingsHosts`) calls App Service / Function **config list**, persists **setting names + parsed hostnames + Key Vault URI host/secret name**, and emits `hostnameInferredTarget` / `appToKeyVaultRef`. Hosted collector **must not** POST; emit completeness `app-settings-not-collected-hosted-get-only`.

## Why

`Microsoft.Web/sites/config/list` is **not** Reader and is typically POST. Hostname `prodsql.database.windows.net` is Inferred coupling. Key Vault refs are probable app→vault (not secret values). This is the first extra-permission diagram slice.

## Context

- `docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md` §4.3 / §6
- Trust center / `docs/library/AZURE_EXTRACTOR.md` never-collected list
- Prior redaction incidents: nested `connectionString` leaks — ingest tests required

## What to build

1. PowerShell only: `POST`/`Invoke-AzRestMethod` list appsettings and connection-string **names**. Hosted ZipBuilder: do not call the API; warning on manifest.
2. Redaction: drop values matching password/key/token/secret/SharedAccessKey; parse `Server=tcp:host` and `@Microsoft.KeyVault(SecretUri=https://vault/secrets/name)` for **host + secret name**. Persist `{ siteResourceId, settingName, host?, keyVaultHost?, secretName? }`.
3. Map unique host → inventoried ARM id `hostnameInferredTarget`. KV host → vault `appToKeyVaultRef`. Ambiguous host → no edge + warning.
4. Docs: new optional role (`Website Contributor` is too much — document the **least** Graph/ARM action, often `microsoft.web/sites/config/list/action`). Customer README + trust-center honesty: we store hosts and secret **names**, never values.
5. Tests: connection string with password not stored; KV ref stores vault host + name; hosted package lacks the companion and has the warning; unique SQL host matches server.

## Acceptance criteria

- Default **off**. Fail-soft 403.
- No Kudu. No Key Vault secret GET.

## Constraints

- Do not enable hosted POST. Do not add Entra Global Reader.
- Compile Pester + Application mapper + a redaction ingest test that fails if `Password=` appears in the companion.

## Done when

Tier 1 with the switch produces **Likely connected to** SQL from a redacted setting, and hosted runs stay GET-only.
