> **Scope:** Engineering backlog for the customer Azure extractor ZIP path, Terraform export, and citations — extends `docs/library/V1_SCOPE.md` sections 2.16–2.17; not procurement copy.

# Azure extractor and Terraform export — technical backlog

This file tracks **remaining** work after the initial ingest API, MVP PowerShell collector, CLI `aztfexport` wrapper, citation helper, and buyer-facing trust/runbook text.

## Shipped in this iteration (baseline)

- `POST /v1/azure-extractor/upload` with `manifest.json` schema **1** enforcement, **52 MiB** ZIP cap, optional `runId` association, SQL persistence (`dbo.AzureExtractorPackages`), audit events (`AzureExtractorPackage.*`).
- `scripts/azure/Get-ArchLucidAzurePackage.ps1`: **read-only** `Get-AzResource` inventory to `manifest.json`, `resources.json`, `README.txt` (cost/advisor/retail flags warn-only until extended).
- `archlucid azure terraform-export`: non-interactive **resource-group** mode wrapping `aztfexport`, adds `ADVISORY.md`, zips output.
- `AzureExtractorCitationFormatter` for future evidence-bundle lines.
- Advisory Terraform comment templates in `ArchLucid.Application`.

## Backlog (prioritized)

1. **Extractor parity:** cost actual/amortized, Advisor cost recommendations, orphan candidates, optional Retail Prices API append; expand resource inventory (NICs, public IPs, private endpoints) with the same read-only discipline; script signing recipe plus CI URL allow-list check.
2. **Ingest hardening:** offload very large ZIPs to private blob (SQL row keeps pointer and manifest copy); download API for operators; malware scanning stance in runbook.
3. **Evidence bundle wiring:** reference stored `packageId` and manifest timestamp on generated cost lines automatically.
4. **Terraform C2:** advisory `.tf` snippets from findings with snapshot tests and `terraform fmt` / `terraform validate` CI (container job); explicit UI gate before any future `destroy`-shaped emit.
5. **Policy test:** repository-wide regression ensuring no `terraform apply` or customer-directed `terraform destroy` orchestration beyond documented third-party tool behavior.
6. **Continuous Tier 2:** service principal plus federated credential design (Reader plus Cost Management Reader only) with implementation behind a feature flag.
