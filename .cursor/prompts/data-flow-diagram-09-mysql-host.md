# DFV-09 — Read the MySQL host without keeping the connection string

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-06, DFV-07, or DFV-08 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-08 is not required. Do not redo the icon map.

## Goal

An Azure MySQL linked service whose host is in a connection string resolves to the in-snapshot MySQL server when the host is `*.mysql.database.azure.com`. When the host is only a Key Vault reference, the card says the host is in Key Vault. The connection string is never stored.

## Why

`AzureInventoryAdfLinkedServiceTargetResolver.ExtractKnownHosts` already indexes `Microsoft.DBforMySQL/servers` and `flexibleServers` as `{name}.mysql.database.azure.com`. `TryExtractTargetHost` for `AzureMySql` reads only the `server` property.

`AzureInventoryAdfTypePropertyReader` refuses `connectionString` because that property is in `BlockedTypePropertyNames`. Older MySQL linked services put the host in `Server=` inside that string, or store `server` as an `AzureKeyVaultSecret` object. Both paths leave `TargetHost` empty, so the linked service stays an external card named `azuremysql1` and never meets the MySQL server.

App-setting host rows are a separate collector. Do not change that mapper in this session.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetExtractor.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfTypePropertyReader.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs` (`ExtractKnownHosts`)
- `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolverTests.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceRow.cs`

## What to build

1. Branch `dfv/09-mysql-host` from current `master`.
2. For `AzureMySql` only, when `server` is a plain host, keep today's behavior.
3. When `server` is empty and `connectionString` is a string, read that string in memory, take the host from `Server=` or `server=`, and discard the rest. Do not assign the raw string to `TargetHost`. Do not log it. Do not add it to a row, a graph property, or a warning. Leave `connectionString` on the blocked list for every other reader.
4. Accept a host with or without a port. Compare the host in lowercase. A value that is not a hostname does not become `TargetHost`.
5. When `server` or `connectionString` is an object whose `type` is `AzureKeyVaultSecret` or `SecureString`, leave `TargetHost` empty and record that the host is in Key Vault. Put that fact on the linked-service row in a dedicated flag or the existing Key Vault resource id. Do not copy `secretName` into a diagram label.
6. A resolved `*.mysql.database.azure.com` host must still flow through `TryResolveTargetArmId` so the edge lands on the MySQL server instead of an external node.
7. Tests:
   - `server` `mysql-edw.mysql.database.azure.com` still resolves to the flexible server with that name.
   - `connectionString` `Server=mysql-edw.mysql.database.azure.com;Database=app;Pwd=secret` resolves to that same server. The test fixture may contain a password. No assertion, warning, row, or node contains `Pwd=` or `secret`.
   - An `AzureKeyVaultSecret` object on `server` does not resolve to an external hostname and records the Key Vault fact.
   - `AzureSqlDatabase` still ignores `connectionString`.

## Acceptance criteria

- A MySQL linked service with a plaintext server host connects to the matching in-snapshot server.
- A password inside a connection string never leaves the parser.
- A Key Vault reference stays unresolved and is marked as Key Vault, not as a guessed server.
- SQL database linked services do not start reading connection strings.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not collect new config files. Do not call Key Vault.
- Working-tree safety. Stage only the extractor, the row flag if you add one, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter FullyQualifiedName~AzureInventoryAdfLinkedService
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner that a new inventory capture is required before Data flow can show the MySQL change. After that capture, `azuremysql1` should either connect to the MySQL server whose host was in the connection string, or say that the host is in Key Vault. Wait for that look before any commit.
