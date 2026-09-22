# SA-05 — Intended network reachability engine

**Do not** claim packets flowed. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Enumerate **intended** control-plane network paths from internet-facing or otherwise exposed nodes to snapshot assets, using NSG, public IP, private endpoint, subnet, and explicit route evidence. Missing controls are InsufficientEvidence hops, not implicit allow.

## Why

“Are these two subnets connected?” is not architecture. “What intended paths exist from exposure to a sensitive asset?” is. Overclaiming reachability is how SecureNow becomes dangerous.

## Context

- Plane §§2, 5 (Intended vs observed vs unverified)
- SA-01/SA-02
- Snapshot network tables from IE-01/IE-02
- Do **not** call Azure Network Watcher or flow logs in this prompt

## What to build

1. `PathKind=IntendedReachability`. Start nodes: public IP, `enablePublicNetworkAccess`, public inbound NSG allow (cited rule). End nodes: resources in snapshot (optionally filtered when SA-18 assertion exists).
2. Compose PE, NIC/subnet, NSG allow/deny **you can cite**. If NSG is absent, hop band = InsufficientEvidence with reason `nsg-not-collected-or-unassociated` — do **not** emit Confirmed Internet→SQL.
3. Azure Firewall / Front Door / App Gateway: only if snapshot rows exist; otherwise stop with InsufficientEvidence, do not skip the hop.
4. Finding copy: “intended control-plane path,” never “traffic is flowing.”
5. Tests: public IP + open NSG 443 to subnet of storage → Possible or HighlyLikely per your documented rules; no NSG → not Confirmed; PE-only SQL with public disabled → no Internet start node; tenant isolation.

## Acceptance criteria

- Engine never writes ObservedFact for “routesTo” unless the relationship was ObservedFact in SA-02.
- No flow-log dependency.

## Constraints

- Not a data-plane traceroute product.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

A fixture with public storage vs PE-only SQL produces different path kinds/bands an operator can defend.
