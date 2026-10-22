# DMW-02 — Match private-link hostnames already in the inventory

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DMW-01 in this session. Do not replace warnings with questions.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DIAGRAM_MATCHER_WARNING_LUNA_PROMPTS.md`

**Depends on:** `AzureInventoryAdfLinkedServiceTargetResolver.ExtractKnownHosts` on master. App settings, factory linked services, pipeline flows, and dependency observations already resolve through `BuildHostIndex`. Do not add a second index.

## Goal

A collected hostname `{name}.privatelink.{public suffix}` resolves to the same inventoried resource as the public hostname, when that public host is unique. Storage queue, table, and file hosts resolve the same way. Key Vault's private host is `{name}.privatelink.vaultcore.azure.net`. A host that matches more than one resource stays unresolved. Property-derived hosts (container app FQDN, Databricks workspace URL) are not given an invented private-link alias.

## Why

`ExtractKnownHosts` yields public names only: `{account}.blob.core.windows.net` and `{account}.dfs.core.windows.net`, `{server}.database.windows.net`, `{vault}.vault.azure.net`, and the other public suffixes in that method. It does not yield queue, table, or file hosts. It never yields a `privatelink` label.

App settings and linked services often store the private DNS name. `AzureInventoryAppSettingHostEdgeMapper` then adds `app-settings-host-unresolved:{host}` for a store that is in the snapshot. That warning means the index missed a name, not that the resource is missing.

Key Vault is the exception to a mechanical insert. The public host is `{vault}.vault.azure.net`. The private zone is `{vault}.privatelink.vaultcore.azure.net`, not `{vault}.privatelink.vault.azure.net`. Indexing the wrong name would attach an app setting to a vault the setting did not name.

Security: hostname rows stay names only. Do not read or persist secret values. Do not add hosted POST `config/list`. A matched host stays DeterministicInference or the provenance `TryResolveTargetArmId` already uses. Do not promote it to ObservedFact.

Scalability: aliases are a fixed set per resource, still collapsed by `BuildHostIndex` when two resources share a host.

Reliability: an external host that is not in the snapshot still warns `app-settings-host-unresolved`. Ambiguous names still match nothing.

Cost: no new Azure HTTP. No `$scriptVersion` bump. ArchLucid and SecureNow packages both call this resolver at ingest. Re-upload of an existing ZIP is enough; a new collection is not required.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs` (`BuildHostIndex`, `ExtractKnownHosts`, the SQL catalog key)
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppSettingHostEdgeMapper.cs` (`IsSqlServerHost`, `TryResolveDatabaseTarget` — the catalog key is `{host}|{catalog}`)
- `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolverTests.cs`
- Callers of `BuildHostIndex`: app-setting mapper, ADF linked-service mapper, ADF pipeline-flow mapper, dependency-observation mapper. They should pick up new keys with no signature change.

## What to build

1. Keep `BuildHostIndex` as the only public index. Add private helpers on `AzureInventoryAdfLinkedServiceTargetResolver`, in that file. Do not add a new type.

2. For each public host this method already constructs from the resource name, also yield the private-link form: insert `privatelink.` after the first label. `sa.blob.core.windows.net` becomes `sa.privatelink.blob.core.windows.net`. Apply that to SQL, Synapse, Cosmos, PostgreSQL, MySQL, Redis, Event Hub, Service Bus, App Service, Cognitive Services, and Search. Lowercase the host. If the first label is missing, or `.privatelink.` is already present, yield the public host only.

3. Storage accounts (`Microsoft.Storage/storageAccounts`) yield five public suffixes and each private-link alias: `blob`, `dfs`, `queue`, `table`, and `file`, all under `.core.windows.net`. Blob and dfs stay. Queue, table, and file are new.

4. Key Vault (`Microsoft.KeyVault/vaults`) yields `{name}.vault.azure.net` and `{name}.privatelink.vaultcore.azure.net`. Do not yield `{name}.privatelink.vault.azure.net`. Only a single-label vault name takes the `vaultcore` alias. Do not run the generic insert on `.vault.azure.net`.

5. The SQL database catalog key stays `{server}.database.windows.net|{database}`. Also yield `{server}.privatelink.database.windows.net|{database}`. `IsSqlServerHost` already treats a host that ends with `.database.windows.net` as SQL, which includes the private-link form. The catalog lookup uses the host string as collected, so the private-link key has to be in the index.

6. Do not alias hosts copied from properties: container app `configuration.ingress.fqdn`, and Databricks `workspaceUrl`. Those strings are the names Azure recorded. Inserting `privatelink` would invent a host.

7. Ambiguous hosts stay omitted. `BuildHostIndex` already drops a key whose distinct ARM ids are not exactly one. The new aliases must go through that dictionary. Two storage accounts with the same name omit both the public and the private-link hosts.

Do not change `app-settings-host-unresolved`. A host that still misses the index warns as it does today. Do not edit the customer package scripts.

## Tests

Extend `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolverTests.cs`. Existing cosmos, ambiguous storage, SQL catalog, container app, cognitive, and search tests stay green.

1. One storage account named `sa1` maps `sa1.blob.core.windows.net`, `sa1.dfs.core.windows.net`, `sa1.queue.core.windows.net`, `sa1.table.core.windows.net`, `sa1.file.core.windows.net`, and the five `sa1.privatelink.{suffix}.core.windows.net` hosts, all to that account's normalized ARM id.
2. The existing ambiguous-storage test also omits `sa1.privatelink.blob.core.windows.net` and `sa1.queue.core.windows.net`.
3. A SQL server `prodsql` maps `prodsql.privatelink.database.windows.net`. A database `archlucid` on that server maps `prodsql.privatelink.database.windows.net|archlucid` to the database ARM id, and still maps the public catalog key.
4. A Key Vault `kv1` maps `kv1.vault.azure.net` and `kv1.privatelink.vaultcore.azure.net`. The index does not contain `kv1.privatelink.vault.azure.net`.
5. A container app FQDN and a Databricks `workspaceUrl` host are indexed as given. Neither gains a `privatelink` alias.

Do not add a live Azure test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile and run `dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryAdfLinkedServiceTargetResolverTests'`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not bump `$scriptVersion`. Do not edit the customer package scripts.
- Do not re-run SN-PE-04, AX-DE, AX-DC, or DMW-01 as greenfield.

## Done when

A unique inventoried storage account, SQL server, SQL database, and Key Vault resolve the private-link hostnames above. Queue, table, and file hosts resolve that storage account. A shared name still resolves to nothing. Container app and Databricks hosts are unchanged. `app-settings-host-unresolved` remains for a host that is not in the index. The stored banner changes only when a snapshot is materialized again.
