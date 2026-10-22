# NR-31 — Collect linked services and resource role assignments

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-28 and NR-29. Do not re-run NR-01 through NR-30. Do not edit the NR index.

## Goal

A new inventory collection stores Data Factory linked services and role assignments scoped to one resource, so those lines can become proof. Until a snapshot is collected again, the diagram keeps the NR-29 dashed **Likely** lines and draws **Has access** only for assignments already stored.

## Why

The Data Factory and Key Vault guesses exist because the snapshot often has no linked service and no role assignment. Linked services and role assignments are readable with Reader. Key Vault references inside app settings are not. Reading them calls the app configuration `list` action, which needs more than Reader and returns secret values with the references. This session does not do that.

## What to build

Collect, with the existing Reader-scoped extractor path:

- Data Factory linked services, through the existing `AzureInventoryAdfLinkedServiceEdgeMapper` path when it already accepts those rows. Fill whatever gap still drops a successful linked-service row before the mapper. A resolved target stays a solid stored link and suppresses the NR-29 guess for that factory, which `HasCitedEdgeFrom` already does when the stored edge exists.
- Role assignments whose scope is a single resource. Stamp the principal id, the role name, and the scope ARM id so NR-28 can draw **Has access**.
- Do not persist resource-group or subscription role assignments as diagram lines. NR-28 already turns those into outline sentences when they are present. You may store them if the existing assignment reader already returns them. Do not add a second Azure call just for those scopes.

Do not call `Microsoft.Web/sites/config/list`, slot config list, or any Function App or Container App secret list. Do not read app settings for Key Vault references. Those guesses remain **Likely** until a later decision.

Do not query flow logs. Do not add a new resource type beyond linked services and role assignments.

Wire the rows into the snapshot the diagram already reads. Do not add a parallel store.

## Tests

1. A collected linked service from a Data Factory to a storage account becomes a stored relationship, and the same-resource-group guess is not added for that factory.
2. A role assignment scoped to one Key Vault is stored with the principal, the role name, and that Key Vault id.
3. The extractor does not request app configuration `list`. A test or a script assertion names the forbidden action and fails if a new call to it appears in the touched collector files.
4. Pester covers the linked-service row and the single-resource role-assignment row. A failed linked-service collection still emits the existing warning and no guessed solid edge.

## Acceptance criteria

- Reader collection can store a linked service and a single-resource role assignment.
- App settings are not read.
- An old snapshot without those rows still shows the dashed **Likely** line.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new collector tests and the touched Pester files under `scripts/azure/tests/`.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A recollection can prove a Data Factory link and a single-resource role, and this session never reads application secrets.
