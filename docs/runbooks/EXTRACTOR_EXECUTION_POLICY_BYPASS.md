> **Scope:** Operator troubleshooting — run the Azure extractor when corporate PowerShell execution policy blocks `.ps1` scripts.

# Azure extractor — PowerShell execution policy bypass

Corporate endpoints often set **Restricted** or **AllSigned** execution policy, which blocks `Get-ArchLucidAzurePackage.ps1` even though the script only performs read-only ARM inventory.

## Recommended approach (current process scope only)

Run the extractor in a **new PowerShell 7+ session** with execution policy bypassed **only for that process**. This does not change machine or user policy permanently.

```powershell
# Open PowerShell 7+ (pwsh), then:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# From the repo root (or path where scripts/azure lives):
./scripts/azure/Get-ArchLucidAzurePackage.ps1 `
  -SubscriptionId "<your-subscription-guid>" `
  -OutputPath "$env:TEMP\archlucid-extractor.zip"
```

When the window closes, **Process** scope resets — your organization's default policy applies again on the next session.

## One-liner (same process scope)

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/azure/Get-ArchLucidAzurePackage.ps1 -SubscriptionId "<sub>" -OutputPath "$env:TEMP\archlucid-extractor.zip"
```

## Organizational compliance

- Obtain **InfoSec or change-management approval** before bypassing policy in production subscriptions.
- Prefer **signed scripts** or an approved internal script host if your security team provides one.
- Do **not** set `-Scope LocalMachine` or `-Scope CurrentUser` to **Unrestricted** unless explicitly directed by your security team — that widens risk beyond a single extractor run.

## After the ZIP is created

Upload via **`POST /v1/azure-extractor/upload`** — see [AZURE_EXTRACTOR_INGEST.md](./AZURE_EXTRACTOR_INGEST.md).

## Related

- Sample extractor output shape: [../samples/AZURE_EXTRACTOR_SAMPLE_OUTPUT.md](../samples/AZURE_EXTRACTOR_SAMPLE_OUTPUT.md)
- Trust / RBAC posture: [../go-to-market/TRUST_CENTER.md](../go-to-market/TRUST_CENTER.md)
