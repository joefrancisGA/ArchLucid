# SA-04 — Path inspector API

**Do not** add a graph visualization product. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Read APIs so operators and later UI (SA-16) can load a path: hops, provenance, confidence band, weakest-hop reason, cited finding ids. No LLM. No apply.

## Why

Paths that exist only inside an engine job cannot be explained, ranked, or verified. The architect sentence in the lecture is an API contract, not a chat reply.

## Context

- SA-01 records; SA-03 ingest
- `OperationalSecurityFindingsController`
- `docs/library/OPENAPI_CONTRACT_DRIFT.md`
- Route registry / `assert_route_tier_policy_nav.py --sync`

## What to build

1. `GET /v1/operational-security/paths` — filter SnapshotId, PathKind, ConfidenceBand, CloudResourceId. Paged. ReadAuthority.
2. `GET /v1/operational-security/paths/{pathId}` — hops in order, finding ids that cite the path, weakest hop.
3. DTO: no confidence numeric; include `provenanceKind` per hop as enum/string already used by IE.
4. OpenAPI snapshot + audit if you add mutations (should be read-only).
5. Tests: foreign tenant 404; finding citation round-trip; OpenAPI contract.

## Acceptance criteria

- Response can populate the lecture template slots: actor, identity, network (nullable), asset, weak control, verify (nullable until SA-14).
- Does not return raw ARM JSON blobs by default (Operate disclosure later).

## Constraints

- Do not add a new review-workspace tab.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'`

## Done when

A client can GET a path and see why it is Possible vs Confirmed without reading SQL.
