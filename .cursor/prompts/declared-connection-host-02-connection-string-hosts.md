# DCH-02 — Read hosts from storage, Service Bus, Event Hub, Cosmos, and Redis strings

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md`

**Depends on:** DCH-01. Do not re-run DCH-01. Do not edit the DCH index.

## Goal

A connection string that names a storage account, Service Bus namespace, Event Hub namespace, Cosmos account, or Redis cache produces the same `app-settings-hosts` row DCH-01 already writes for SQL. The account key and shared access key are not on the row.

## Why

Those strings rarely contain `https://` as a bare URL. They look like `AccountName=starchlucidevarts;AccountKey=...;EndpointSuffix=core.windows.net` or `Endpoint=sb://namespace.servicebus.windows.net/;SharedAccessKey=...`. After DCH-01 the secret marker no longer blocks parsing, and the SQL-only patterns still miss the host.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRedactor.cs`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAppSettingHostFromValue`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppSettingHostEdgeMapper.cs` (reuse the existing hostname edge; do not add a new edge type)

## What to build

Parse these shapes in both the C# redactor and `Get-ArchLucidAzureAppSettingHostFromValue`. Emit the existing host field. Do not add columns.

1. Storage. When the value has `AccountName=` and `EndpointSuffix=`, build `{account}.{service}.{suffix}`. Use `blob` unless the value contains `QueueEndpoint`, `TableEndpoint`, or `FileEndpoint`. When more than one of those endpoint keys is present, emit one host per endpoint. Lowercase the host. Do not copy `AccountKey`.
2. Service Bus and Event Hubs. `Endpoint=sb://{host}/` yields that host, lowercased, with no port and no path. Do not copy `SharedAccessKey` or `SharedAccessKeyName`.
3. Cosmos. A host ending in `.documents.azure.com` yields that host.
4. Redis. A host ending in `.redis.cache.windows.net` yields that host. Do not copy `password=`.

An `https://` URL that DCH-01 already parses stays on that path. Do not double-emit it.

The existing mapper turns a unique host into the inferred hostname edge. An ambiguous host stays on the existing unresolved warning. Do not promote the edge to an observed fact.

## Tests

1. `DefaultEndpointsProtocol=https;AccountName=starchlucidevarts;AccountKey=abc;EndpointSuffix=core.windows.net` yields `starchlucidevarts.blob.core.windows.net`. The serialized row does not contain `abc` or `AccountKey=`.
2. The same string with `QueueEndpoint=https://starchlucidevarts.queue.core.windows.net/` yields the queue host and does not also invent a second blob host when `QueueEndpoint` is the only endpoint key.
3. `Endpoint=sb://orders.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc` yields `orders.servicebus.windows.net` and does not contain `abc`.
4. `myaccount.redis.cache.windows.net,password=abc,ssl=True` yields `myaccount.redis.cache.windows.net` and does not contain `abc`.
5. `https://myaccount.documents.azure.com:443/` yields `myaccount.documents.azure.com`.
6. C# and PowerShell agree on each of those fixtures.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` and run the redactor tests plus the touched Pester file.
- Do not commit unless the user names the branch in that request.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer concrete types over `var`. A blank line before `if` and `foreach` unless it is the first line in the method.
- Do not add a new companion file. Do not change hosted collection in this session.

## Done when

Those five connection shapes contribute a host row, and the key or password from the fixture is absent from the serialized row.
