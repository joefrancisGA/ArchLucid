> **Scope:** Smoke validation — ServiceNow outbound finding → incident (MVP path).

# Smoke — ServiceNow incident export

## Prerequisites

- ServiceNow instance + credentials (OAuth or basic) stored in **Key Vault** secret names referenced by tenant connector configuration.
- ArchLucid tenant with ServiceNow connector enabled per [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md).

## Happy path (operator)

1. Produce a committed architecture run with at least one finding in a **non-production** ServiceNow target (pilot subscription).
2. Trigger the product action that opens/creates a **ServiceNow incident** from a finding (UI or documented API — see OpenAPI for the stable route in your build).

## Verification

- **ITSM row:** incident exists with correlation field pointing back to ArchLucid run/finding identifiers.
- **Audit:** connector write attempts appear in audit stream with success outcome (see audit catalog for event types).

## Troubleshooting

- **Auth errors:** rotate OAuth refresh or basic secret via Key Vault; confirm IP allow lists if instance-bound.
- **CMDB lookup missing:** validate `SystemName` mapping per catalog CMDB guidance before tightening policies.
