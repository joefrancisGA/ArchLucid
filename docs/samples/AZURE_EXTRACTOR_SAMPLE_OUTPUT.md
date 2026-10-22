> **Scope:** Illustrative, heavily redacted samples of Azure extractor ZIP contents — not real tenant data.

# Azure extractor — sample output (illustrative)

The collector script **`scripts/azure/Get-ArchLucidAzurePackage.ps1`** produces a schema-versioned ZIP. Files below match **schema version `1`** accepted by **`POST /v1/azure-extractor/upload`**.

## `manifest.json` (required)

```json
{
  "schemaVersion": 1,
  "scriptVersion": "1.0.0-example",
  "collectionTimestamp": "2026-05-22T12:00:00.0000000Z",
  "subscriptionId": "00000000-0000-0000-0000-000000000000",
  "managementGroupId": null,
  "scope": "/subscriptions/00000000-0000-0000-0000-000000000000",
  "switchesUsed": ["IncludeCost"],
  "azModuleVersion": "7.0.0-example"
}
```

When **`-IncludeCost`** is used, the same file may include **`actualCostSummary`** (subscription ActualCost via Cost Management — not a separate `cost-actual.json` file):

```json
{
  "actualCostSummary": {
    "timeframe": "MonthToDate",
    "currency": "USD",
    "rows": [
      { "serviceName": "Virtual Machines", "preTaxCost": 1234.56 }
    ]
  }
}
```

If Cost Management RBAC is insufficient, **`actualCostSummary`** may be **`null`** and the script logs a warning without failing the run.

## `resources.json` (required)

Array of read-only ARM inventory records (Key Vault **secrets** are never collected):

```json
[
  {
    "resourceType": "Microsoft.Compute/virtualMachines",
    "resourceId": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-demo/providers/Microsoft.Compute/virtualMachines/vm-demo",
    "name": "vm-demo",
    "location": "eastus",
    "resourceGroup": "rg-demo",
    "tags": { "env": "demo" },
    "properties": {
      "provisioningState": "Succeeded",
      "vmSize": "Standard_D2s_v3"
    }
  }
]
```

## Optional files

| File | When present |
|------|----------------|
| `policy-compliance.json` | Every run — Policy Insights latest states |
| `retail-prices.json` | `-IncludeRetailPrices` — public Retail Prices API (illustrative USD rows) |
| `README.txt` | Every run — human-readable collection summary |

## Upload

```http
POST /v1/azure-extractor/upload
Content-Type: multipart/form-data
```

Field **`file`** = the ZIP. See [../runbooks/AZURE_EXTRACTOR_INGEST.md](../runbooks/AZURE_EXTRACTOR_INGEST.md).

## Related

- Execution policy troubleshooting: [../runbooks/EXTRACTOR_EXECUTION_POLICY_BYPASS.md](../runbooks/EXTRACTOR_EXECUTION_POLICY_BYPASS.md)
