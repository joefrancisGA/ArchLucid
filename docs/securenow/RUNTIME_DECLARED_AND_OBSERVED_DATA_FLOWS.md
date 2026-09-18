> **Scope:** Product design for closing the ArchLucid DEV (and similar Container Apps) **Data flow** gap: declared app wiring from ARM, optional observed overlay, optional SQL principal probe, optional uploaded-config confirmation. **Contributor-reference** — internal engineering only. **Not implementation.**
> **Created:** 2026-09-18
> **Spine:** [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) · [`EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) · [`ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) · **Prompts:** [`../architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md) (**SN-RT-01–SN-RT-10** + hold)

# Runtime declared and observed Data Flow connections

Owner question (2026-09-18): the ArchLucid DEV Data flow canvas showed **19 nodes, 0 relationships**. Prefer **not** requiring Terraform. Willing to query logs, SQL, or ask the operator to upload config and confirm inferred edges.

This note locks **four options**. Implementation is **SN-RT** prompts only — do not code from this file.

## Locked diagnosis (do not re-diagnose)

1. ArchLucid DEV wiring lives on **Container Apps env** (`ConnectionStrings__*`, `ArchLucid__Secrets__KeyVaultUri`, `ArtifactLargePayload__AzureBlobServiceUri`, `ARCHLUCID_API_BASE_URL`). Those names are on the **ARM GET** (`properties.template.containers[].env[]`). Subscription **Reader** can read literal values; secret-backed entries are `secretRef` names only.
2. `Get-ArchLucidAzureAppSettingHostCompanionRows` only walks `Microsoft.Web/sites` and POSTs `config/appsettings/list`. It never reads Container Apps. Hosted stays GET-only (AX-DE-18).
3. The value parser only matches `Server=tcp:` and `@Microsoft.KeyVault(SecretUri=...)`. Bare `https://` URIs and `Initial Catalog=` / `Database=` are dropped. Host index maps `*.database.windows.net` to the SQL **server**, not a database.
4. `AzureInventoryRbacDataPlaneRoleMap` does not know Queue Sender/Processor, OpenAI User, Search Index Data Contributor. Cognitive / Search ARM types have **no Data flow stage**, so those nodes drop even if an edge existed.
5. SQL on DEV is **Entra user inside the database**, not `SQL DB Contributor` on the ARM id — RBAC alone will not paint SQL.
6. Observed traffic (App Insights, SQL audit, storage/KV diagnostics) is a **different family**. Never merge into declared/authorized arrows.

## Four options

| Option | Question it answers | Azure permission | Band | SN-RT |
|--------|---------------------|------------------|------|-------|
| **A** | What do Container Apps **declare** (env + RBAC + hostname)? | **Reader** (hosted GET-only) | Inferred / Probable | **01–05** |
| **B** | What **called** what in the last N days? | Log Analytics Reader + diagnostics on | Observed | **06–07** |
| **C** | Which **Entra principals exist as database users**? | SQL login / Entra to each DB (opt-in) | Proven (membership), not traffic | **08** |
| **D** | What do **uploaded** appsettings / `.env` / compose / `terraform show -json` declare, after the operator **confirms**? | None | HumanAssertion | **09–10** |

**Run A first.** B is an overlay. C is only if a buyer needs membership proof without SQL auditing. D is the escape hatch for non-Azure or missing Reader env.

## Honesty

- A/D: **may access / likely connected / declared in settings** — not “data flowed.”
- B: **observed in logs (window)** — fail-soft empty when scaled to zero or diagnostics off.
- C: **Entra principal is a user in this database** — not packets.
- `{0}` tenant-catalog templates stay **server-level** until D confirmation or C membership.

## Related

| Area | Pointer |
|------|---------|
| Per-link table (DEV) | Conversation 2026-09-18; expected picture in [`ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md) |
| Collector companion | `app-settings-hosts.json` (AX-DE-18) — extend, do not fork |
| RBAC | `AzureInventoryRbacDataPlaneRoleMap`, `AzureInventoryAppAuthorizedAccessEdgeMapper` |
| Terraform ingest (reuse in D) | [`../integrations/TERRAFORM_STATE_IMPORT.md`](../integrations/TERRAFORM_STATE_IMPORT.md) |
| Hold | [`../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md) |
