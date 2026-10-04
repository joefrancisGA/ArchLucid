# DFV-12 — One card per external host, and a real resource when the host matches

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-16, DFV-17, DFV-20, or DFV-21 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master` after DFV-11, DFV-13, DFV-14, DFV-18, and DFV-19. Do not redo persistence, the edge router, column wrap, horizontal scroll, the DFV-14 rollup rule, or the PNG fallback. Collapse shared hosts before that rollup runs, so the Source column has fewer cards for DFV-14 to group.

## Goal

On **Data flow — what may connect**, the same SFTP or HTTP host is one card, with an edge from each factory that uses it. A saved host that matches a resource already in the snapshot connects to that resource, and the extra external card is gone.

## Why

DFV-11 puts `TargetHost` and `LinkedServiceType` back on the external node. The same link name still appears once per factory (`fsxp_sftp` under dev, ppd, and tst). Those cards share a host and draw three copies. A later look at `Hmd_HI_HAP_Non_Prod` still shows a crowded Source column on the left, including stacks of HTTP and SFTP cards. DFV-14 already rolls up more than three cards that share a type, a stage, and the same neighbors. It does not merge two factories that name the same host. This session does that merge.

`AzureInventoryAdfLinkedServiceTargetResolver.BuildHostIndex` already maps `sa1.blob.core.windows.net` to a storage account and `{name}.mysql.database.azure.com` to a MySQL server. That match runs only while the capture is materialized. A host saved by DFV-11 can still sit on an external card when the original match missed, or when DFV-09 fills the host later.

DFV-08 paints `Factory {name}` on each card. After this session, a collapsed card lists the factories once. An uncollapsed card keeps the DFV-08 line.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs` (`BuildHostIndex`, `ExtractKnownHosts`)
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotExternalSourceNodeHydrator.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfExternalSourceNodeFactory.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`

## What to build

1. Branch `dfv/12-same-host-cards` from current `master`.
2. While the snapshot graph is built, index visible resources with `BuildHostIndex` (adapt the snapshot resource rows to the input that method already accepts, or call `ExtractKnownHosts` for the same keys). Do not write a second host catalog.
3. When an external node's saved host matches that index, point the factory edge at the matched resource. Do not create the external card when nothing else still references it. Keep the existing edge label (`uses` or `Likely connected to`).
4. Group the remaining external nodes that share a non-empty host and the same linked-service type. Emit one node. Give it a stable id `adf-external-host:{type}|{host}` in lowercase. Draw an edge from each factory.
5. The collapsed card title is the linked-service name when every member has that name. Otherwise the title is the host. Under the name, paint `Factories {a}, {b}` for two or three factories, and `Factories {a}, {b}, and N more` after that. If DFV-08 already painted `Factory {name}` on a single-factory card, leave that line. Do not paint both a single `Factory` line and a `Factories` line on the same card.
6. Leave a node with an empty host as its own card, including `Host in Key Vault`. Do not merge those.
7. Do not merge two cards whose hosts differ. Do not merge a card that already resolved to an in-snapshot resource with a different target.
8. Copy the type and host through `MermaidDiagramDeterministicRepairer` the same way DFV-05 copies `ExternalLinkedServiceType`. A factory list that dies in repair will not appear.
9. Tests:
    - Two external rows, both `Sftp` / `files.partner.example`, factories `adf-edw-hi-dev` and `adf-edw-hi-tst`, become one card titled with the shared link name. The SVG contains both factory names and two edges into that card.
    - An external row `AzureBlobStorage` / `sa1.blob.core.windows.net` with `sa1` in the snapshot becomes an edge onto that storage account and does not draw an external card.
    - Two rows with empty hosts stay two cards.
    - A Key Vault row with no host stays its own card and contains `Host in Key Vault` when DFV-08 has already added that line. If DFV-08 has not shipped, the card still must not gain a fabricated hostname.

## Acceptance criteria

- One external host is one card.
- A host that matches a snapshot resource connects to that resource.
- Cards with no host stay separate.
- Routing and the `likely ·` wording are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add a table or a migration.
- Do not store or log a connection string.
- Working-tree safety. Stage only the graph resolver, the hydrator, the caption, the repairer if it needs the factory list, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~ExternalSource|FullyQualifiedName~SnapshotGraph"
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramForest|FullyQualifiedName~ExternalSource"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on a capture that has DFV-11 rows. Repeated `fsxp_sftp` or `mssc_http` cards that share a host should be one card with an edge from each factory. A Blob or MySQL host that names a resource in the snapshot should land on that resource. Wait for that look before any commit.
