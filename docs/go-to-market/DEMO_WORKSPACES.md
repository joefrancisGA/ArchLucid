> **Last reviewed:** 2026-07-31

# Demo workspaces — path-stable alias

**Canon (full body + pinned fixture GUID table):** [`DEMO_QUICKSTART.md#demo-workspaces`](DEMO_QUICKSTART.md#demo-workspaces)

**Welcome hero (CTAs / Clarity / compliance):** [`DEMO_QUICKSTART.md#welcome-hero--ctas-analytics-and-compliance`](DEMO_QUICKSTART.md#welcome-hero--ctas-analytics-and-compliance)

**Sample-package funnel ID matrix (M-134):** [`DEMO_QUICKSTART.md#sample-package-funnel-id-matrix`](DEMO_QUICKSTART.md#sample-package-funnel-id-matrix)

**Showcase naming (M-135):** [`DEMO_QUICKSTART.md#showcase-naming-hierarchy-m-135`](DEMO_QUICKSTART.md#showcase-naming-hierarchy-m-135)

This filename remains path-stable for smoke callers. CI GUID checks run against the demo quickstart canon (`Validate-DemoWorkspacesDoc.ps1`).

**Startup seed:** When `Demo:AnonymousViewer:Enabled = true`, `DemoSeedStartupHostedService` applies showcase demo seed on API startup (see `ArchLucid.Api/Hosting/DemoSeedStartupHostedService.cs`).

**Fixture flag (canon):** `Demo:AnonymousViewer:Enabled = true` — see [`DEMO_QUICKSTART.md#demo-workspaces`](DEMO_QUICKSTART.md#demo-workspaces).
