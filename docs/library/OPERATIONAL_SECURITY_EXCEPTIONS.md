# Operational security exceptions (IE-12)

Time-bounded operational exceptions for infra-evidence findings, patterns, or cloud resources. Distinct from architecture `RiskExceptionRecord` (TB-059).

## Targets

At least one of:

- `FindingId` — operational security finding (IE-09)
- `PatternId` — remediation pattern (IE-10)
- `CloudResourceId` — inventory resource reference

## Lifecycle

| Status | Meaning |
|--------|---------|
| **Active** | Exception suppresses operational visibility until `ExpirationUtc` |
| **Expired** | Past `ExpirationUtc`; finding visibility reopened |
| **Revoked** | Manually ended before expiration |

## Expiry behavior

On sweep (`IOperationalSecurityExceptionService.SweepExpiredAsync`):

1. Mark `Active` records past `ExpirationUtc` as `Expired`
2. For linked findings: set status `Open` (or `Recurred` if previously `Closed`)
3. Append idempotent observation with `SourceSystem = ArchLucid.ExceptionExpiry`

Expired exceptions remain listable (not hidden).

## Approval SoD

`RequestedByActorKey` and `ApprovedByActorKey` must differ (same rule as remediation pattern approval).

## Schema

Migration **359** — `dbo.OperationalSecurityExceptions`

## Related

- IE-09 operational findings
- IE-13 remediation preflight checks `HasActiveExceptionForFindingAsync`
