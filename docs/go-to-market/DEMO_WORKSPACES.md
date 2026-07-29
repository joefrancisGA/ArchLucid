> **Reviewed:** 2026-07-29

> **Scope:** Path-stable alias for hosted GA demo workspaces and welcome-hero analytics. Not an independent quickstart.

# Demo workspaces (alias)

**Last reviewed:** 2026-07-29

**Canonical workspaces + welcome hero:** [`DEMO_QUICKSTART.md#demo-workspaces`](DEMO_QUICKSTART.md#demo-workspaces).

**Welcome hero (CTAs / Clarity / compliance):** [`DEMO_QUICKSTART.md#welcome-hero--ctas-analytics-and-compliance`](DEMO_QUICKSTART.md#welcome-hero--ctas-analytics-and-compliance).

**Sample-package funnel ID matrix (M-134):** [`SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md`](SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md) — surface → package → IDs (Claims vs Product Tour Contoso vs Workspace B); do not mix universes on one CTA.

Workspace A/B narrative, scope triplets, living-fixture PR discipline, and marketing hero analytics live only in the demo quickstart. This file keeps the historical path stable for `Validate-DemoWorkspacesDoc.ps1` and smoke callers.

## Pinned fixture anchors (CI)

| Label | GUID |
|-------|------|
| defaultTenantId | `11111111-1111-1111-1111-111111111111` |
| workspaceA.runId | `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| workspaceA.workspaceId | `2b2571e1-1884-62a2-1e8b-15a2a70a0342` |
| workspaceA.projectId | `9beb918c-83d4-1385-0486-21f341806c5c` |
| workspaceB.runId | `61c60d76-2b80-93f9-46bb-2f66fd608b9b` |
| workspaceB.workspaceId | `3f1a16c3-172e-5632-c53a-3ed16446f603` |
| workspaceB.projectId | `49074cdf-bdab-a5fa-789b-09a3e556a8f2` |

Manifest: `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`.
