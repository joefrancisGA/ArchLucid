# SN-PE-04 — Private-endpoint reachable hop (DNS join required)

**Wave:** SecureNow probable-evidence Data Flow (**SN-PE**). **Depends on:** SN-PE-01 (`peReachableTarget` constant). Prefer SN-PE-03 merged so the hop can paint. **Do not** implement SN-PE-05–07 except tests that compile Data Flow if 03 is present.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Derive **compute → store** `peReachableTarget` only when private-endpoint DNS proves the app’s VNet can resolve the PE. Never emit “every VNet-integrated app → every PE target in the subscription.” Never stamp ObservedFact. Never a percent.

## Why

Owner advice composed:

```text
Web App → VNet Integration → Private Endpoint → SQL
```

into Web App → SQL at **95%**. Azure did not record that hop. In hub-and-spoke landing zones a shared PE subnet would fan out every spoke app onto every PaaS store. `privateDnsVnetLink` and `peDnsZoneGroup` are already in the ZIP and unused for this join.

## Context

- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` §7
- `AzureInventoryRelationshipAssociationTypes` — `AppServiceToSubnet`, `VmToNic`, `NicToSubnet`, `PrivateEndpointTarget`, `PeToSubnet`, `PeDnsZoneGroup`, `PrivateDnsVnetLink`, `PeReachableTarget`
- Existing network association materializer / snapshot relationship rows
- Capability-to-flow must **not** gain “data flowed” copy

## What to build

1. New helper class (own file) — example `AzureInventoryPrivateEndpointReachableEdgeMapper` — that reads **already materialized** association rows (or snapshot relationships). Null-check. Skip `_collection_failed`.
2. Join algorithm (document in a short comment):

   - Resolve compute `C` → subnet `S` → VNet `V` (`appServiceToSubnet`, or `vmToNic` + `nicToSubnet`; subnet ARM id contains the VNet id — reuse any existing VNet parser, do not regex ad hoc in three files).
   - For each `privateEndpointTarget` `PE → T` (T is a data/store ARM id in snapshot):
     - Require `peDnsZoneGroup` `PE → Z`.
     - Require `privateDnsVnetLink` `Z → V` where `V` is **C’s VNet**.
     - If missing DNS group or link → **no edge** (do not fall back to “same subscription”).
     - PE subnet may differ from `S` (hub PE, spoke app) **only** because the DNS link is to `V`.
   - Dedupe `(C, T)` (multiple PEs to the same store → one edge).
   - **Do not** walk `vnetPeering` in this prompt.

3. Emit relationship: `fromResourceId = C`, `toResourceId = T`, `associationType = peReachableTarget`, provenance **DerivedFact**, band **Probable**. If PE subnet’s VNet equals `V` **and** DNS join hits, band **HighlyLikely**. Never Confirmed / ObservedFact.
4. Label via catalog: **Private network path**. Not May access. Not Reads from. Not connects (too vague on Data Flow).
5. Completeness (optional string, fail-soft): if `privateEndpointTarget` exists for T, C is VNet-integrated, and DNS join misses → warning `pe-reachable-dns-link-missing` (do not invent an edge to “be helpful”).
6. Tests (must fail on current master):
   - **Positive, same VNet:** App Service subnet in VNet A, PE in VNet A targeting SQL, zone group + VNet A link → one App→SQL `peReachableTarget`, HighlyLikely or Probable per rule above (lock one in the test).
   - **Positive, hub-spoke:** App in spoke VNet B, PE in hub VNet H targeting SQL, zone group on PE, **link to VNet B** → one App→SQL edge.
   - **Negative, hub-spoke false positive:** App1 in VNet B **with** DNS link; App2 in VNet C **without** DNS link; shared hub PE → SQL. **Only App1** gets the edge. App2 must not.
   - **Negative, integration only:** App VNet-integrated, SQL has PE, **no** `peDnsZoneGroup` or **no** link to app VNet → zero `peReachableTarget`.
   - Provenance is DerivedFact, not ObservedFact.
   - Data Flow compile (if SN-PE-03 present): App and SQL show; PE/VNet nodes do **not**.

## Acceptance criteria

- No new Azure HTTP. No new ZIP companion (derive from existing association rows).
- Network mode still shows PE→SQL as today (do not remove `privateEndpointTarget`).
- CapabilityToFlowCopyGuard still rejects “data flowed” if you touch narratives (prefer not to).

## Constraints

- Working-tree safety. Do **not** re-collect PE/DNS (IE-RF / AX-DE-15).
- Do **not** add numeric 95.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~PrivateEndpointReachable|PeReachable'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlow'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s.

## Done when

The hub-spoke **negative** test is the product: shared PE does not authorize every spoke on Data Flow.
