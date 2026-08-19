# Quick Scan emergency shutdown

Operators can stop **new** anonymous Quick Scan AI executions without redeploying by setting the runtime safety override.

## Runtime override API

- **GET** `/v1/admin/quick-scan/safety` — current operational snapshot (requires `AdminAuthority`)
- **PUT** `/v1/admin/quick-scan/safety` — set override (requires `AdminAuthority`, audited)

### Modes

| Mode | Anonymous AI | Sample endpoint |
|------|----------------|-----------------|
| `Normal` | Follows `ArchLucid:QuickScan:Safety` appsettings | Per config |
| `Disabled` | Off | Off |
| `EmergencyDisabled` | Off | On (when sample fallback enabled) |
| `SampleOnly` | Off | On |

### Example (emergency stop)

```http
PUT /v1/admin/quick-scan/safety
Content-Type: application/json

{
  "operationalMode": "EmergencyDisabled",
  "publicMessage": "Quick Scan is temporarily unavailable. Try the illustrative sample.",
  "reason": "Spend anomaly — incident INC-1234"
}
```

## Propagation

- Override is stored in SQL (`QuickScanSafetyOperationalOverride`) and cached for **5 seconds** per API instance.
- Enforcement runs before queue admission, budget reservation, and immediately before the provider call.
- In-flight scans are allowed to finish (default); new requests are rejected with HTTP 503.

## Fail-closed

- If the override store is unreadable in **Production** or **Staging**, anonymous execution is treated as **emergency disabled** (sample remains available when configured).
- Invalid production safety configuration is blocked at startup via `QuickScanSafetyOptionsValidator` (`ValidateOnStart`).

## Restore

Set `operationalMode` to `Normal` with a reason documenting clearance.

## Related configuration

- Appsettings: `ArchLucid:QuickScan:Safety` (`EmergencyDisabled` is superseded by runtime override when not `Normal`)
- Runbook companion: `docs/operations/quick-scan-budget-monitoring.md` (TB-899)
