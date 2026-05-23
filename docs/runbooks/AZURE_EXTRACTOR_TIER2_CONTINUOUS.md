> **Scope:** Tier 2 continuous Azure extractor ingestion — customer-owned automation that runs `Get-ArchLucidAzurePackage.ps1` on a schedule and uploads to ArchLucid.

> **Spine doc:** [`../START_HERE.md`](../START_HERE.md).

# Azure extractor — Tier 2 continuous ingestion

## 1. Objective

Enable **zero-touch** architecture and cost snapshots for Azure estates without giving ArchLucid standing credentials in the customer tenant. The customer provisions a **read-only** service principal, runs the signed extractor on a schedule, and **POST**s the ZIP to ArchLucid.

## 2. Prerequisites

| Item | Requirement |
|------|-------------|
| Azure RBAC | `Reader` + `Cost Management Reader` on subscription or management group |
| Identity | Federated workload identity (GitHub Actions / Azure DevOps OIDC) preferred over long-lived secrets |
| ArchLucid | `ExecuteAuthority` API key or JWT for `POST /v1/azure-extractor/upload` |
| Script | [`scripts/azure/Get-ArchLucidAzurePackage.ps1`](../../scripts/azure/Get-ArchLucidAzurePackage.ps1) |

## 3. Provision the service principal

1. Create an app registration (or use an existing automation principal).
2. Assign **Reader** and **Cost Management Reader** at subscription or management group scope.
3. Configure federated credentials for your CI platform (recommended) or store a client secret in your vault (rotate regularly).

## 4. Scheduled collection (GitHub Actions example)

```yaml
name: archlucid-azure-extractor
on:
  schedule:
    - cron: "0 6 * * 1" # weekly Monday 06:00 UTC
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  collect-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Collect package
        shell: pwsh
        run: |
          ./scripts/azure/Get-ArchLucidAzurePackage.ps1 `
            -SubscriptionId "${{ secrets.AZURE_SUBSCRIPTION_ID }}" `
            -OutputPath "$env:RUNNER_TEMP/archlucid-package.zip" `
            -IncludeCost `
            -IncludeRetailPrices
      - name: Upload to ArchLucid
        shell: pwsh
        env:
          ARCHLUCID_API_BASE: https://api.example.com
          ARCHLUCID_API_KEY: ${{ secrets.ARCHLUCID_API_KEY }}
          RUN_ID: ${{ vars.ARCHLUCID_REVIEW_RUN_ID }}
        run: |
          # Use archlucid CLI or curl per your environment; bind upload to an existing review runId.
          archlucid azure extractor upload --run-id $env:RUN_ID --package "$env:RUNNER_TEMP/archlucid-package.zip"
```

Replace upload wiring with your tenant’s CLI or REST contract. See [`AZURE_EXTRACTOR_INGEST.md`](AZURE_EXTRACTOR_INGEST.md).

## 5. Management group scope

For enterprise hierarchies, pass **`-ManagementGroupId`** instead of **`-SubscriptionId`** on the collector script. Cost collection still requires an explicit **`-SubscriptionId`** when using **`-IncludeCost`**.

## 6. Security posture

- ArchLucid never receives `Owner`, `Contributor`, or directory **Global Reader**.
- Review ZIP contents before upload; the script never exports Key Vault secret values.
- Rotate automation credentials on your standard enterprise cadence.

## Related

| Doc | Use |
|-----|-----|
| [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.16 | Product contract |
| [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) | Tier 2 hosted WIF + V1.x auto-pull architecture |
| [`AZURE_EXTRACTOR_INGEST.md`](AZURE_EXTRACTOR_INGEST.md) | Upload API and validation |
| [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) | Tier 1 vs Tier 2 buyer narrative |
