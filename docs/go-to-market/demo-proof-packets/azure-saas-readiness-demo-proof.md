# Demo proof packet — Azure SaaS readiness

**Evidence basis:** **Demo-derived** · **Manual review required** for AI narrative

## Input assumptions

- Sample multi-tenant SaaS on Azure App Service, Azure SQL, Front Door, Key Vault.
- Simulator or demo tenant — not a named customer deployment.
- No V1.1 Jira/ServiceNow/Confluence connectors required.

## Top findings (illustrative)

| Finding | Category | Evidence label |
| --- | --- | --- |
| Managed identity for app → Key Vault | Topology | Demo-derived |
| Front Door TLS termination | Topology | Demo-derived |
| App Service zone redundancy gap | Cost | Estimate |

## Deferred (out of V1 scope)

- SOC 2 CPA attestation report
- Third-party penetration test summary publication
- Native ITSM connectors (V1.1)

## What not to claim

- Do not quote verified customer ROI or production SLA history from this packet.
- Do not present as procurement-safe proof without a committed buyer `runId`.

## Next step

Run [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) on buyer evidence or accepted demo workspace.
