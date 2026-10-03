# EX-SP-02 — Page the Resource Graph placement queries

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new EX-SP in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/AZURE_EXTRACTOR_SUBNET_PLACEMENT_LUNA_PROMPTS.md`

**Depends on:** EX-SP-01. The object-array reader must already be in the tree.

## Goal

`nicToSubnet`, `vmToNic`, subnet control rows, and `vnetPeering` are collected for every matching resource in the subscription, not only the first Resource Graph page.

## Why

`Get-ArchLucidAzureNetworkAssociationRowsViaResourceGraph` and `Get-ArchLucidAzureAvdSessionHostAssociationRowsViaResourceGraph` call `Search-AzGraph -First 1000` once and then stop. The inventory query in `Get-ArchLucidAzureResourcesViaResourceGraph` already follows `Get-ArchLucidResourceGraphPageSkipToken` until the skip token is empty. The placement query does not.

A failed page is an empty `catch`. The zip is still marked `SecurityInventory` `Succeeded`, and the missing rows are indistinguishable from a subscription that has no subnet placement. EX-SP-01 fixes the row shape. It does not fetch page two, and it does not say when a page failed.

## Read first

- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`
- `scripts/azure/ArchLucid.ResourceGraph.helpers.ps1` (`Get-ArchLucidResourceGraphPageDataArray`, `Get-ArchLucidResourceGraphPageSkipToken`, `Get-ArchLucidAzureResourcesViaResourceGraph`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` (the `SecurityInventory` catch that replaces `network-associations.json` with `[]`)
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` (the same catch)

## What to build

Page both placement queries the same way the inventory query pages.

- Loop while the skip token is non-empty. Pass `-SkipToken` on the later pages. Keep `-First 1000`.
- Apply that loop to the virtual machine query, the network interface query, the virtual network query, and the AVD session-host query.
- A failed page must not discard rows already accepted from earlier pages of that query, and must not discard rows from the other queries.
- Record the page failure with `Write-Warning`, including the query kind and the exception message. Do not use an empty `catch`.
- Do not rethrow. Rethrowing hits the package script's `SecurityInventory` catch, which replaces the whole `network-associations.json` with `[]` and deletes rows that were already built.
- Leave association types, the object reader from EX-SP-01, and `$scriptVersion` alone.

## Tests

Extend `scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1` only where the paging decision can be tested without `Search-AzGraph`. If the skip-token loop cannot be called without Azure, add a small helper that walks a fake page sequence and assert:

1. Two pages of NIC rows both contribute `nicToSubnet` rows.
2. A failure on page two keeps the `nicToSubnet` rows from page one and emits a warning.

Do not add a live Azure test.

## Acceptance criteria

- A subscription with more than 1000 network interfaces still writes a `nicToSubnet` row for an interface that would have fallen on page two.
- A failed later page keeps the rows already collected.
- The package script still writes the associations it has. It does not replace the file with `[]` because one page failed.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Run `pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ResourceGraph.RelationshipQueries.helpers.Tests.ps1'"`.
- Do not edit the diagram renderer or the hosted zip builder.
- Do not commit. Do not edit unrelated dirty files.

## Done when

The placement queries follow the same skip-token loop as the inventory query, and a failed page leaves the earlier `nicToSubnet` rows in place.
