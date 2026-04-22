> **Scope:** ADR — cached anonymous marketing `GET /v1/demo/preview` and `/demo/preview`; not operator auth design or SQL migrations.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# ADR 0027 — Cached anonymous marketing commit-page preview

## Status

Accepted (2026-04-21)

## Context

Marketing needs a credible **“see a real commit page”** story. The operator shell already exposes a rich run detail page, but it requires an authenticated operator session. **`GET /v1/demo/explain`** proves explainability, yet it is a **different shape** than the commit page buyers expect (manifest summary, authority chain, artifacts, timeline).

## Decision

Ship **`GET /v1/demo/preview`** (anonymous, **`DemoEnabled`** feature gate, **`fixed`** rate limit) returning a **single bundled JSON** (`DemoCommitPagePreviewResponse`), plus a marketing **`/demo/preview`** page that renders that payload with **ISR** (`revalidate = 300`).

Cache **three layers**:

1. **In-process** `IHotPathReadCache` (TTL **`Demo:PreviewCacheSeconds`**).
2. **HTTP** `Cache-Control` + **`ETag`** / **`304`**.
3. **Next.js** `revalidate` on the marketing route.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Static screenshot / build-time HTML | Drifts from schema and seed; breaks the “live services” promise. |
| Hit operator **`/v1/authority/*`** anonymously for demo tenant | Would require widening auth on production-shaped controllers — unacceptable. |
| Reuse **`/v1/demo/explain`** only | Wrong payload shape for a commit-page UI. |
| Redis / distributed cache for this bundle | Overkill for a single small JSON blob; adds infra coupling for a marketing surface. |
| Per-request uncached reads | Risk to SQL under bursty traffic from `/welcome` links. |

## Consequences

- **Positive:** one URL for CDN/browser caching; clear security boundary (dedicated read model client; no auth relaxation on existing controllers).
- **Negative:** up to **TTL** staleness after re-seed; multi-instance hosts can diverge slightly between replicas (acceptable for marketing).

## Implementation pointers

- **`IDemoSeedRunResolver`** + **`DemoSeedRunResolver`** — shared canonical/bounded-scan resolution for **`DemoReadModelClient`** and **`DemoCommitPagePreviewClient`**.
- **`DemoCommitPagePreviewController`** — cache key **`demo-preview:bundle:v1:latest`** with identity carried in the cached value.
- **`HotPathCache:Enabled=false`** profiles still register a **small** `IHotPathReadCache` so the preview route does not force SQL hot-path caching on.
