# SA-03 — Privilege-path engine

**Do not** add `IFindingEngine`. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Deterministically enumerate **transitive privilege paths** on a snapshot’s security edges: identity → role assignment → scope → data/control-plane action. Persist `PathKind=Privilege` and ingest an `OperationalSecurityFinding` that **cites** `PathId`.

## Why

“Who has Owner?” is a scanner question. “Which identities can ultimately change production, including via managed identity?” is architect reasoning. Review-graph `identity-blast-radius` must stay on the sealed architecture stream; this engine writes the **operational** stream.

## Context

- Plane §§1, 5
- SA-01 path repository; SA-02 edges
- `IOperationalSecurityFindingIngestService`
- `docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md` (do not write `FindingsSnapshot`)
- `IdentityBlastRadiusFindingEngine` — **pattern only**, do not call it

## What to build

1. `IPrivilegePathEngine` (name as you like) in Application/InfraEvidence. Input: `SnapshotId` + tenant scope. Output: paths + ingest items.
2. Traverse HAS_ROLE / USES_IDENTITY / CAN_READ / CAN_WRITE / CAN_ASSUME. Cap depth and fan-out (config, documented defaults). Do not explode the full RBAC lattice unbounded.
3. SourceSystem `ArchLucid.SecureNowArchitect`. SourceFindingId = canonical hop hash. Title/description must name the **path**, not only the leaf role.
4. Finding `PathId` populated. Severity from a documented table (e.g. Owner/UAA/identity-admin on production-tagged or asserted crown-jewel &gt; Contributor on unused RG). Production tag absence → do not invent production; band/consequence stays Unknown.
5. Completeness: if role is not on the data-plane allowlist, emit path with InsufficientEvidence hop “unknown role actions” rather than skipping silently **or** skipping with a snapshot warning — pick one, test it, document it.
6. Tests: MI → Storage Blob Data Reader → storage account yields a path; heuristic-only CONTAINS does not; foreign tenant 404; ingest idempotent; no `IFindingEngine` registration.

## Acceptance criteria

- `BuiltInFindingEngineTypeCatalog` unchanged.
- Finding title would still be true if the identity had no direct Owner assignment but a transitive MI path.

## Constraints

- No GitHub/Entra in this prompt (SA-19/SA-20).
- No “exfiltrates” language.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

A snapshot fixture produces a privilege path finding that cites hops with provenance.
