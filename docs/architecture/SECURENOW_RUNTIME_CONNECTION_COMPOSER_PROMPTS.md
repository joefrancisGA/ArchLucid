> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that close the ArchLucid DEV (and similar Container Apps) **Data flow** gap: Reader-declared env/RBAC/hostname wiring, optional observed overlay, optional SQL principal probe, optional uploaded-config confirmation. Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Design:** [`../securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`](../securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md). **Hold:** [`../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md).
> **DEV picture:** [`../securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md`](../securenow/ARCHLUCID_DEV_DATA_FLOW_CONNECTION_REFERENCE.md).
> **Paste files:** [`.cursor/prompts/securenow-runtime-connection-00-index.md`](../../.cursor/prompts/securenow-runtime-connection-00-index.md) (one numbered file per session).
>
> **Do not** re-run **AX-DE-01–18**, **AX-DC-01–08**, **SN-DF-01–08**, or **SN-PE-01–07** as greenfield. Do not persist secret **values**. Do not merge observed arrows into **May access**. Hosted stays GET-only.

# SN-RT-01–SN-RT-10 — Runtime declared and observed Data Flow connections

**Observed:** Owner (2026-09-18) on an empty ArchLucid DEV Data flow canvas (**19 nodes, 0 relationships**). Prefer **not** requiring Terraform. Willing to query logs, SQL, or ask the operator to upload config and **confirm** inferred edges.

**Product framing (locked):** four options. **A** is the primary fix (Reader ARM GET + parsers + RBAC/stages). **B** is a time-window overlay. **C** is in-database Entra membership. **D** is the non-Azure / Key Vault–only escape hatch. Families stay distinct.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Container Apps env never collected | **SN-RT-01** | DEV SQL/KV/blob/API URLs stay invisible |
| Catalog + bare HTTPS dropped | **SN-RT-02** | Hosts without databases; blob/KV URIs unused |
| SQL grain is server-only; UI FQDN unused | **SN-RT-03** | Edges to SQL **server**, not `archlucid`; no UI→API |
| OpenAI/Search/CS have no host index or stage | **SN-RT-04** | Nodes drop even when ARM type exists |
| Queue/OpenAI/Search RBAC returns `None` | **SN-RT-05** | Terraform-assigned roles never become **May access** |
| No Log Analytics companion | **SN-RT-06** | Cannot overlay “what called what” |
| Logs would look like declared wiring | **SN-RT-07** | Operators read audit hits as architecture |
| In-DB Entra users invisible | **SN-RT-08** | SQL still empty when `SQL DB Contributor` is absent |
| No appsettings / `.env` / compose ingest | **SN-RT-09** | Key Vault–only env and non-Azure stay blank |
| Silent upload inference | **SN-RT-10** | `{0}` catalogs and unresolved hosts auto-paint |
| Secret harvest / Kudu / hosted POST / ER | **SN-RT-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-RT-01** Container Apps env | **A first** | AX-DE-18 row shape on trunk |
| **SN-RT-02** Value parser | After 01 (or stub against strings) | SN-RT-01 |
| **SN-RT-03** SQL catalog + FQDN | After 01+02 | Host index |
| **SN-RT-04** PaaS hosts/stages | After 03 (may parallel **05**) | SN-RT-03 preferred |
| **SN-RT-05** RBAC allowlist | After 03 (may parallel **04**) | SN-PE-05 role-map pattern |
| **SN-RT-06** LAW companion | **B** after A if you want join keys | SN-RT-01 principal ids preferred |
| **SN-RT-07** ObservedRuntime family | After 06 | SN-PE-01 catalog |
| **SN-RT-08** SQL principals | **C** anytime after 01 | Compute `principalId` |
| **SN-RT-09** Upload parsers | **D** independent of A; better after 02 | SN-RT-02 extractors |
| **SN-RT-10** Confirm HumanAssertion | After 09; prefer 03 | Proposed-edge DTO |
| **SN-RT-HOLD** | Not implementation | — |

**Run A first.** B is an overlay. C is only if a buyer needs membership proof without SQL auditing. D is the escape hatch.

**Run one prompt per chat.** Feature branch per prompt (`cursor/sn-rt-<short-name>-a7c1`). Name the branch in any commit/push request. This prompt-set PR may live on `cursor/runtime-connection-prompts-30fc`.

## Shared constraints (every prompt)

- Plane wins. One Azure collector family. No `terraform apply` / ARM writes. No second ZIP collector. Hosted GET-only. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**. Do **not** implement G-REAL-06.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Persist hosts, catalog **names**, secret **names**, ARM ids. Never persist connection-string **values**, KV secret values, or API keys.

### Locked facts (do not re-diagnose)

- Container Apps env is on ARM **GET** (`properties.template.containers[].env[]`). App Service still uses `config/list` (AX-DE-18). Do not add hosted POST.
- Parser today matches `Server=tcp:` and `@Microsoft.KeyVault(SecretUri=...)` only.
- Host index maps `*.database.windows.net` to the SQL **server**, not a database.
- DEV SQL auth is in-database Entra users, not `SQL DB Contributor`.
- Observed traffic is a **different family**. Never merge into declared/authorized arrows.
- `{0}` tenant-catalog templates stay **server-level** until D confirmation or C membership.
- Do not mint OpenAI / Search / Fabric when the ARM type is absent.

---

# SN-RT-01 — Container Apps env companion (Option A)

**Depends on:** AX-DE-18 row shape on trunk · **Branch:** `cursor/sn-rt-container-apps-env-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-01-container-apps-env.md`](../../.cursor/prompts/securenow-runtime-connection-01-container-apps-env.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: collect Container App environment variable names, parsed hosts, Key Vault URI hosts, and secretRef names from the ARM GET into the existing app-settings-hosts.json companion. Never persist values. Hosted stays GET-only. Do not POST config/list for Container Apps.

This is NOT AX-DE, AX-DC, SN-DF, or SN-PE greenfield. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md
- docs/architecture/SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md
- .cursor/prompts/securenow-runtime-connection-00-index.md
- .cursor/prompts/securenow-runtime-connection-01-container-apps-env.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).

Implement only What to build in the paste file. Tests must fail on current master, pass after. Do not implement SN-RT-02 catalog/HTTPS parse beyond reusing today’s extractors.

Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

---

# SN-RT-02 — Setting value parser (Option A)

**Depends on:** SN-RT-01 row shape (or stub parser tests against strings) · **Branch:** `cursor/sn-rt-setting-value-parser-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-02-setting-value-parser.md`](../../.cursor/prompts/securenow-runtime-connection-02-setting-value-parser.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: parse hosts, SQL catalog names, and Key Vault URI hosts from setting values without keeping the values. Cover Server=tcp:, Initial Catalog=/Database=, bare https:// URLs, and existing Key Vault SecretUri extractors. {0}/{tenant} catalogs stay null with warning app-settings-catalog-template.

Read first: .cursor/prompts/securenow-runtime-connection-02-setting-value-parser.md and docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md

Do not implement SQL host-index grain (SN-RT-03). PowerShell + C# ingest must agree. Working-tree script before tracked edits. No git add -A.
```

---

# SN-RT-03 — SQL catalog + Container App FQDN edges (Option A)

**Depends on:** SN-RT-01 + SN-RT-02 · **Branch:** `cursor/sn-rt-sql-catalog-fqdn-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-03-sql-catalog-and-fqdn.md`](../../.cursor/prompts/securenow-runtime-connection-03-sql-catalog-and-fqdn.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: SQL FQDN + unique catalog → database ARM id; unique FQDN without catalog → server + warning; Container App ingress FQDN in another app’s env → Container App ARM id. Never edge to master. Ambiguous catalogs get a warning and no database edge.

Read first: .cursor/prompts/securenow-runtime-connection-03-sql-catalog-and-fqdn.md

Do not implement OpenAI/Search stages (SN-RT-04) or RBAC allowlist (SN-RT-05). Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```

---

# SN-RT-04 — PaaS host index and Data Flow stages (Option A)

**Depends on:** SN-RT-03 preferred · **Branch:** `cursor/sn-rt-paas-hosts-stages-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-04-paas-hosts-and-stages.md`](../../.cursor/prompts/securenow-runtime-connection-04-paas-hosts-and-stages.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when Azure OpenAI, AI Search, or Cognitive Services exist in the snapshot, index their hostnames and give them Data Flow stages (OpenAI/Content Safety → Transform; Search → Storage) so ApplyDataFlowFilter does not drop them. Do not mint nodes when the ARM type is absent. Network mode unchanged.

Read first: .cursor/prompts/securenow-runtime-connection-04-paas-hosts-and-stages.md

Do not add RBAC role names (SN-RT-05). Working-tree script. No git add -A.
```

---

# SN-RT-05 — RBAC data-plane allowlist (Option A)

**Depends on:** SN-PE-05 role-map pattern · **Branch:** `cursor/sn-rt-rbac-allowlist-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-05-rbac-allowlist.md`](../../.cursor/prompts/securenow-runtime-connection-05-rbac-allowlist.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: map exact built-in Azure roles (Queue Sender/Processor/Contributor, OpenAI User, Search Index Data Contributor/Reader, Search Service Contributor, ACS/email contributor) in AzureInventoryRbacDataPlaneRoleMap so appAuthorizedAccess fires. Do not regress SN-PE-05 Service Bus/Event Hub rows. Exact OrdinalIgnoreCase names only.

Read first: .cursor/prompts/securenow-runtime-connection-05-rbac-allowlist.md
Working-tree script. No git add -A.
```

---

# SN-RT-06 — Log Analytics observed companion (Option B)

**Depends on:** SN-RT-01 identity principal ids preferred · **Branch:** `cursor/sn-rt-log-analytics-companion-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-06-log-analytics-companion.md`](../../.cursor/prompts/securenow-runtime-connection-06-log-analytics-companion.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional extractor companion dependency-observations.json — counts of observed app→target calls from Log Analytics, joined by MI object id or App Insights role name. Switch -IncludeDependencyObservations default false. Fail-soft on missing workspace/403. No query payloads, no SQL text, no secrets. Hosted skip unless a GET-only Logs Query API is already in the family.

Read first: .cursor/prompts/securenow-runtime-connection-06-log-analytics-companion.md and docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md

Do not paint Data Flow yet (SN-RT-07). Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```

---

# SN-RT-07 — Observed evidence family on Data Flow (Option B)

**Depends on:** SN-RT-06 row ingest + SN-PE-01 catalog · **Branch:** `cursor/sn-rt-observed-family-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-07-observed-family.md`](../../.cursor/prompts/securenow-runtime-connection-07-observed-family.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: paint dependency-observations.json as a new Data Flow evidence family ObservedRuntime with labels Observed in logs. Never reuse May access / Reads from / Writes to. Honesty legend must say observations are a time window, not architecture. No percent field.

Read first: .cursor/prompts/securenow-runtime-connection-07-observed-family.md

Do not add SQL DMVs (SN-RT-08). Do not promote ObservedRuntime to ADF Reads from. Working-tree script. No git add -A.
```

---

# SN-RT-08 — SQL database principals probe (Option C)

**Depends on:** inventory SQL servers + compute principalId · **Branch:** `cursor/sn-rt-sql-principals-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-08-sql-principals.md`](../../.cursor/prompts/securenow-runtime-connection-08-sql-principals.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional fail-soft companion sql-database-principals.json — Entra user/app names in sys.database_principals (type E/X only) per inventoried user database. Map unique names to Container App identities as May access (DerivedFact, not ObservedFact). Switch -IncludeSqlDatabasePrincipals default false. Hosted omit. Query only name + type_desc. No sys.tables, no FKs.

Read first: .cursor/prompts/securenow-runtime-connection-08-sql-principals.md and docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md

Do not implement upload parsers (SN-RT-09). Working-tree script. No git add -A.
```

---

# SN-RT-09 — Uploaded config parsers (Option D)

**Depends on:** SN-RT-02 parse rules · **Branch:** `cursor/sn-rt-uploaded-config-parsers-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-09-uploaded-config-parsers.md`](../../.cursor/prompts/securenow-runtime-connection-09-uploaded-config-parsers.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: accept operator-uploaded non-secret config extracts (appsettings.json, .env, Docker Compose environment maps) and emit proposed hostname/catalog edges. Reuse terraform show-json ingest; do not reimplement Terraform. Reuse SN-RT-02 extractors. Never store unmatched secret-like values. Do not auto-commit proposals as HumanAssertion (SN-RT-10).

Read first: .cursor/prompts/securenow-runtime-connection-09-uploaded-config-parsers.md and docs/integrations/TERRAFORM_STATE_IMPORT.md

Do not run terraform on the host. Do not Kudu. Working-tree script. No git add -A.
```

---

# SN-RT-10 — Confirm inferred connections (Option D)

**Depends on:** SN-RT-09 proposed-edge DTO; prefer SN-RT-03 · **Branch:** `cursor/sn-rt-confirm-human-assertion-a7c1`

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-10-confirm-human-assertion.md`](../../.cursor/prompts/securenow-runtime-connection-10-confirm-human-assertion.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: show proposed connections from upload and/or unresolved A inferences; operator confirm or dismiss. Confirmed rows become ProvenanceKind.HumanAssertion and paint on Data Flow as Confirmed connection (HumanConfirmed family). Dismissed rows never paint. Do not auto-confirm. Do not call Azure at confirm time. Visible-boundary buttons. Disable confirm until a row is selected. Do not hide desktop review workspace tabs behind More.

Read first: .cursor/prompts/securenow-runtime-connection-10-confirm-human-assertion.md

Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```

---

# SN-RT-HOLD — not implementation

**Paste file:** [`.cursor/prompts/securenow-runtime-connection-11-hold.md`](../../.cursor/prompts/securenow-runtime-connection-11-hold.md)

Library copy: [`docs/library/SECURENOW_RUNTIME_CONNECTION_HOLD.md`](../library/SECURENOW_RUNTIME_CONNECTION_HOLD.md).

Paste only when a session starts secret harvest, Kudu, merging observed arrows into declared, SQL table/FK harvest, hosted POST, or a second ZIP collector.
