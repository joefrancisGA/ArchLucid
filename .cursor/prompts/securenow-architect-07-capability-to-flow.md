# SA-07 — Capability-to-flow engine

**Do not** claim that data moved or was exfiltrated. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Follow **possible** information movement from permissions + intended reachability + declared snapshot dependencies (e.g. diagnostic target, PE, explicit Service Bus association **when rows exist**). Label hops DeterministicInference or weaker. Sensitivity requires a `SecurityAssetAssertion` (SA-18) or stays Unknown.

## Why

“Where can sensitive information ultimately flow?” is the right question. ARM/ARG cannot prove flow. SecureNow must model capability-to-flow and say “may access / may reach.”

## Context

- Plane §§2, 5 CapabilityToFlow
- SA-03 privilege + SA-05 reachability
- `DataFlowTrustBoundaryFindingEngine` — do not register or reuse as IFindingEngine

## What to build

1. `PathKind=CapabilityToFlow`. Start at resources with CAN_READ/CAN_WRITE (or equivalent derived edges) **and** a path to a workload identity.
2. Optional egress hop: internet-bound NSG allow or absence of deny with InsufficientEvidence if egress is unknown.
3. Copy allowlist: “may access”, “may reach”, “possible movement”. Deny list in tests: `exfiltrat`, `data flowed`, `will leak`, `PHI left the vnet` unless assertion + Confirmed network (still prefer “may”).
4. Without SA-18, do not mention PHI/patient; use “data-bearing resource” only if a snapshot property you cite says so (e.g. SQL), else “asset.”
5. Tests: SQL + AKS MI reader + outbound * → Possible capability-to-flow; copy guard; no ObservedFact on the flow hop.

## Acceptance criteria

- Engine can emit paths when assertions are missing (consequence Unknown).
- AI is not used.

## Constraints

- No Service Bus fan-out invention without snapshot relationship rows.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

Control-plane capability is visible and epistemically honest.
