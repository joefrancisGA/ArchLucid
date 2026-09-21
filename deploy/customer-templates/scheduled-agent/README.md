# Customer-owned scheduled Azure extractor agent

Prefer this path when operators should **not** pull inventory from a command line or UI. The customer tenant runs a read-only collector on a timer and **POST**s the ZIP to ArchLucid.

**Collector:** the existing `Get-ArchLucidAzurePackage.ps1` family — this template does not invent a second ARM walker.

**Identity:** Automation Account **system-assigned managed identity** with **Reader** + **Cost Management Reader** on the target subscription. ArchLucid never receives a client secret.

**Secret:** ArchLucid `ExecuteAuthority` API key stays in **Key Vault**. The runbook reads it at job time.

## What Terraform creates

| Resource | Purpose |
|----------|---------|
| Resource group | Agent host |
| Automation Account (PowerShell 7.2) | Weekly runbook |
| Storage account + private container | Pinned collector script ZIP |
| Key Vault | API key secret |
| Role assignments | Reader, Cost Management Reader, Storage Blob Data Reader, Key Vault Secrets User |
| Weekly schedule (Monday 06:00 UTC) | Recurrence |

## Apply

```bash
cd deploy/customer-templates/scheduled-agent/terraform
cp terraform.tfvars.example terraform.tfvars
# edit subscription_id, archlucid_api_base_url, scope ids, schedule_start_time_utc
terraform init
terraform validate
terraform apply
```

If you omit `archlucid_api_key`, set the secret after apply:

```bash
az keyvault secret set \
  --vault-name <key_vault_name output> \
  --name archlucid-api-key \
  --value "<ExecuteAuthority API key>"
```

Wait until Automation modules **Az.Accounts**, **Az.Resources**, and **Az.ResourceGraph** finish importing, then start **`Invoke-ArchLucidScheduledAzureExtractor`** once to verify upload.

## Function timer (same orchestrator)

`function/` hosts the same `Invoke-ArchLucidScheduledAzureExtractor.ps1` on a Monday 06:00 UTC timer. Copy the collector scripts from `scripts/azure/` (plus `scripts/ArchLucid.AuthHeaders.ps1`) into the function app next to `scheduled-extractor/run.ps1`. App settings match the Automation variable names. Use this when your estate already standardizes on Functions; Terraform in this folder remains the Automation runbook path.

## Security

- No `Owner`, `Contributor`, `User Access Administrator`, or Entra **Global Reader**.
- ZIP contents follow the collector exclusions (no Key Vault secret values).
- Pin the collector ZIP in **your** storage account; `terraform apply` refreshes it from this repository checkout.

## Related

- **Canonical operator runbook:** [`docs/runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md`](../../../docs/runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md) (architecture, prerequisites, troubleshooting)
- Ingest API: `docs/runbooks/AZURE_EXTRACTOR_INGEST.md`
- Tier 2 hosted WIF (ArchLucid pulls): `deploy/customer-templates/README.md`
