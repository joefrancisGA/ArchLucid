# SA-09 — Path ranking (independent dimensions)

**Do not** ship a multiplicative magic score as the product of record. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Rank `SecurityEvidencePath` rows with a persisted, explainable breakdown: technical exposure, privilege depth, blast radius, business consequence, confidence band. `Unknown` consequence must not zero a real technical path. Reuse IE-15 ideas; do not replace resource-level IE-15.

## Why

`exposure × exploitability × privilege × blast radius × business consequence` is the right *shape* and a trap as a product: missing classification would hide catastrophic technical paths.

## Context

- Plane §7
- `docs/library/REMEDIATION_PRIORITIZATION_AND_WAVES.md`
- SA-04 GET path

## What to build

1. `SecurityEvidencePathRankRecord`: path id, rule version `SA09-rank-v1`, dimension scores as **integers or small decimals with documented caps**, optional overall **rank order** (not a 0–100 “risk %”).
2. Ranking policy documented in `docs/library/SECURENOW_PATH_RANKING.md`: lexicographic (confidence/exposure/privilege/radius) **or** weighted sum that treats Unknown consequence as a **neutral** dimension (neither 0 nor max). Tenant-configurable weights allowed; LLM cannot write rank rows.
3. `GET /v1/operational-security/paths/ranked` and `GET .../paths/{id}/rank` explaining each dimension in prose from the numbers (deterministic template).
4. Tests: two paths identical except missing PHI assertion — technical rank does not collapse to last; Confirmed public+Owner outranks Possible missing-tag combination; weights change order in a unit test.

## Acceptance criteria

- GET explains the score without an LLM.
- No percentage confidence.

## Constraints

- Do not delete IE-15 APIs.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

Operators can sort paths like an architect, not like CVSS.
