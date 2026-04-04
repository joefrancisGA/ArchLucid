# ADR 0006: URL-path API versioning (`/v1`)

- **Status:** Accepted
- **Date:** 2026-04-04

## Context

Clients need a stable contract while allowing future breaking changes.

## Decision

Major version in the URL path: **`/v1/...`**, with Asp.Versioning reporting supported/deprecated headers where configured.

## Consequences

- **Positive:** Obvious routing at edge (APIM, Front Door); easy Bruno/OpenAPI alignment.
- **Negative:** Longer paths; v2 will duplicate surface until old versions sunset.

## Links

- `docs/API_CONTRACTS.md`
