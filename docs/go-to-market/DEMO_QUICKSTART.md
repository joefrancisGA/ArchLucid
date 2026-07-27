> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid demo quickstart (buyer-facing) plus screenshot capture brief for marketing/demo PNGs (formerly `SCREENSHOT_GALLERY.md`). Full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid demo quickstart (buyer-facing)

**Audience:** Evaluators and champions who want to see the product in minutes without installing the .NET SDK, SQL Server, or Node.js locally. Capture operators also use the [screenshot brief](#screenshot-capture-brief) below.

**Last reviewed:** 2026-07-27

**Grounding:** Same demo data as [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) (Contoso Retail) and [V1_SCOPE.md](../library/V1_SCOPE.md). The Docker path uses **Development** environment, **simulator** agent mode (no Azure OpenAI charges), and **startup demo seed** after DbUp.

---

## Prerequisites

- **Docker Desktop** (Windows or macOS) or **Docker Engine** (Linux)
- That is all — no .NET 10 SDK, no local SQL Server, no Node.js for running the stack

---

## Start the demo (one command) {#start-the-demo-one-command}

From the repository root:

| Platform | Command |
|----------|---------|
| **Windows (PowerShell)** | `.\scripts\demo-start.ps1` |
| **macOS / Linux (Bash)** | `./scripts/demo-start.sh` (ensure executable: `chmod +x scripts/demo-start.sh`) |
| **Manual** | `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack up -d --build` |

The script waits up to **120 seconds** for `http://localhost:5000/health/ready`, then opens the architect workspace (where supported).

**Ports used:** 1433 (SQL), 3000 (UI), 5000 (API), 10000–10002 (Azurite), 6379 (Redis). Free these before starting if something else is bound.

**API port note:** This Docker **full-stack** profile exposes the API on **5000** (see health URL above). When you run **`ArchLucid.Api`** directly from the repo (e.g. [`OPERATOR_QUICKSTART.md`](../library/customer-facing/OPERATOR_QUICKSTART.md)), the default local port is often **5128** — same product, different host binding; do not assume one URL works for both without checking your `launchSettings` / compose maps.

---

## Your first five minutes (finished-package-first)

**Do not open with `/reviews/new` or generation.** Trust ladder: show a **completed architecture package** first, then optionally bridge to creation.

1. **Open a finalized package** — From home or **Architecture packages** (`/reviews`), open the seeded **hardened Contoso** review (`6e8c4a102b1f4c9a9d3e10b2a4f0c502` after startup seed; see [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) §3) or the static showcase **Claims Intake Modernization** package at `/reviews/claims-intake-modernization` when running UI-only fixtures. You should land on review detail with findings and manifest linkage already present.
2. **Findings and explainability** — Open one finding. Walk the structured trace (what was examined, rules applied, evidence cited, confidence limits). Call out an **explicit non-conclusion** or evidence gap when the finding flags missing proof — do not imply the AI always concludes.
3. **Finalize / architecture package** — Show the signed review record / architecture package summary (finding counts, decision trail). This is the sponsor-ready package, not a chat transcript.
4. **Export** — Download Markdown, DOCX, or ZIP from review detail or the export flow (consulting templates may require optional configuration).
5. **Creation bridge (one line)** — "Creation follows the same governed pipeline." Optional 30-second peek: home **Open created sample** → `/reviews/northwind-copilot-rag-platform` (**Created** origin badge; see **TB-742**). Do not start the five-minute path there.

**Optional if time remains:** **Compare** two Contoso reviews (`…c501` baseline vs `…c502` hardened) or **Graph** on the opened package. Save **New review** wizard for a longer principal-architect session ([`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md) §30-minute variant).

Adjust entry if you prefer the home dashboard at `http://localhost:3000/` — still open an existing package, not the wizard.

---

## What you are seeing

- **Architecture Proof Engine** — A multi-agent pipeline produces structured findings and a versioned architecture package (reviewed or created); in simulator mode, agents run without calling cloud LLMs.
- **Governance and audit** — Policy packs, optional pre-finalize gates, and durable audit patterns match [POSITIONING.md](POSITIONING.md) and [PRODUCT_DATASHEET.md](PRODUCT_DATASHEET.md).
- **Explainability** — Findings carry traces suitable for review and audit narratives.

For full capability claims, use [V1_SCOPE.md](../library/V1_SCOPE.md) and the [Product datasheet](PRODUCT_DATASHEET.md).

---

## Cleanup

| Platform | Command |
|----------|---------|
| **Windows** | `.\scripts\demo-stop.ps1` |
| **macOS / Linux** | `./scripts/demo-stop.sh` |

This runs `docker compose ... down -v` and removes named volumes (including Azurite data). SQL data in the compose setup is also discarded with `-v` as defined by the stack.

---

## Troubleshooting

- **Timeout on health/ready** — Run `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack logs api` and confirm SQL and Azurite are healthy.
- **Port conflicts** — Stop other services on 1433, 3000, or 5000, or adjust host port mappings in a **local** override (do not commit port changes unless your team standardizes them).

---

## First-run demo script (simulator)

One narrow buyer scenario using **Simulator** execution — not a customer outcome claim.

1. Seed demo data: `dotnet run --project ArchLucid.Cli -- seed-demo-data` (when enabled).
2. Open operator **Home** → complete Core Pilot checklist through commit.
3. Export proof shape: `dotnet run --project ArchLucid.Cli -- pilot proof-packet <demo-run-id> --out artifacts/demo-proof/`
4. Show static packet shape: [`buyer-jobs/AZURE_SAAS_READINESS.md`](buyer-jobs/AZURE_SAAS_READINESS.md#demo-proof-shape-demo-derived-only)

**Expected narrative:** Findings reference policy packs and manifest provenance; banner **demo tenant — replace before publishing**; structural execution mode **Simulator** unless real-mode configured. Failure fallback: use buyer-job demo proof shapes (no live tenant). Never invent customer logos, savings percentages, or reference names.

---

## Next steps

- **Production-style pilot:** [Pilot Guide](../library/customer-facing/PILOT_GUIDE.md)
- **Business case:** [ROI_MODEL.md](ROI_MODEL.md) and [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md)
- **Developer / detailed demo seed:** [demo-quickstart.md](../archive/onboarding/demo-quickstart.md)
- **Hosted GA workspaces (anchors + Smoke):** [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md)
- **Specialty buyer jobs (demo proof shapes):** [`buyer-jobs/README.md`](buyer-jobs/README.md)

---

## Screenshot capture brief {#screenshot-capture-brief}

Former standalone: `docs/go-to-market/SCREENSHOT_GALLERY.md` → this section.

**Audience:** Anyone producing screenshots for the marketing site, sales decks, product documentation, or demo recordings.

This is a **capture brief**: what to show on screen, data state, annotations, and captions. Use a running ArchLucid environment (demo seed recommended) for a consistent set. Save captures under **`docs/go-to-market/screenshots/`** when committing assets.

### Capture prerequisites

- Stack running with **demo seed** — use the [Start the demo](#start-the-demo-one-command) path above (`Demo:Enabled=true` / seed on startup).
- Architect workspace at `http://localhost:3000`.
- At least **two completed reviews** with finalized architecture packages (use `archlucid run --quick` twice or Swagger).
- At least **one comparison** between those two reviews (`/compare` or API).
- **One governance approval request** submitted and one approved (if governance is enabled).
- Browser at **1440×900** or **1920×1080**; **light mode** for the primary set, plus **dark mode** variants. Disable extensions that alter page appearance.

### Screenshot 1: First-run wizard — Preset selection

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard — Step 1 |
| **URL** | `/reviews/new` (legacy `/runs/new` redirects) |
| **Data state** | Fresh page load, no preset selected yet. All three preset cards visible: Greenfield web app, Modernize legacy system, Blank (advanced). |
| **Annotation callouts** | (A) "Choose a starting template or start from scratch" on the preset card area. (B) "Seven guided steps from intent to pipeline" on the stepper indicator. |
| **Caption** | "ArchLucid's guided wizard walks you from a starting template through identity, requirements, constraints, review, and live pipeline tracking — in seven steps." |
| **Dark mode variant** | Yes |

### Screenshot 2: First-run wizard — Review step

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard — Step 6 (Review) |
| **URL** | `/reviews/new` (navigate to step 6; legacy `/runs/new` redirects) |
| **Data state** | Populated from the "Greenfield web app" preset. System name, environment, description, constraints, and capabilities all filled. Validation messages clear (green). |
| **Annotation callouts** | (A) "Full request summary before submission" on the review panel. (B) "Inline validation catches errors before the run is created" near a validated field. (C) "Client-generated request ID for idempotency" on the request ID display. |
| **Caption** | "Review every field before creating the run. The wizard validates inputs inline so errors are caught at design time, not in production." |
| **Dark mode variant** | Yes |

### Screenshot 3: Run detail with pipeline stages

| Attribute | Detail |
|-----------|--------|
| **Screen** | Run detail page |
| **URL** | `/runs/{runId}` (use a completed run) |
| **Data state** | Review is finalized. Pipeline timeline shows all stages completed (Context, Graph, Findings, Architecture package — all with "Ready" badges). Architecture package summary visible below. Artifacts table showing at least 3 rows. |
| **Annotation callouts** | (A) "Real-time pipeline tracking from context to architecture package" on the pipeline timeline. (B) "Versioned architecture package — the source of truth" on the package summary. (C) "Review or download individual artifacts" on the artifacts table. |
| **Caption** | "Every review shows its complete pipeline journey — from context ingestion through graph build, findings generation, and architecture-package synthesis — with artifacts available for review and download." |
| **Dark mode variant** | Yes |

### Screenshot 4: Provenance graph visualization

| Attribute | Detail |
|-----------|--------|
| **Screen** | Provenance graph |
| **URL** | `/runs/{runId}/provenance` |
| **Data state** | Graph loaded for a completed run. Full provenance view selected. Multiple node types visible (snapshots, findings, decisions, manifest, artifacts). Type/color legend visible. |
| **Annotation callouts** | (A) "Visual decision lineage from evidence to artifact" on the graph area. (B) "Color-coded node types: context, findings, decisions, manifest" on the legend. (C) "Click any node to see its detail" near a node. |
| **Caption** | "The provenance graph traces every architecture decision back to the evidence that drove it — context snapshots, findings, decision traces, manifest entries, and synthesized artifacts." |
| **Dark mode variant** | Yes |

### Screenshot 5: Run comparison — structured deltas

| Attribute | Detail |
|-----------|--------|
| **Screen** | Compare two reviews |
| **URL** | `/compare?leftRunId={id1}&rightRunId={id2}` |
| **Data state** | Two finalized reviews compared. Structured architecture-package deltas visible with additions and changes highlighted. AI explanation section expanded (if available). |
| **Annotation callouts** | (A) "Structured architecture deltas between iterations" on the delta section. (B) "Detect drift before it reaches production" as a summary callout. |
| **Caption** | "Compare any two architecture reviews to see exactly what changed — structured architecture-package deltas highlight additions, removals, and modifications with full context." |
| **Dark mode variant** | Yes |

### Screenshot 6: Governance dashboard

| Attribute | Detail |
|-----------|--------|
| **Screen** | Governance dashboard |
| **URL** | `/governance/dashboard` |
| **Data state** | At least one pending approval request visible. Compliance drift chart showing data for the last 30 days (even if sparse). Policy pack change count visible. |
| **Annotation callouts** | (A) "Pending approvals with SLA tracking" on the approval requests section. (B) "Compliance drift trend over time" on the drift chart. (C) "Policy pack activity at a glance" on the change count area. |
| **Caption** | "The governance dashboard gives architects a single view of pending approvals, compliance drift trends, and policy pack activity — so nothing falls through the cracks." |
| **Dark mode variant** | Yes |

### Screenshot 7: Audit event log

| Attribute | Detail |
|-----------|--------|
| **Screen** | Audit log |
| **URL** | `/audit` |
| **Data state** | Multiple audit events visible (at least 8–10 rows). Filters panel showing event type dropdown, date range, and correlation ID field. Summary line showing "Showing N events." Export CSV button visible. |
| **Annotation callouts** | (A) "78 typed audit event types — append-only, tamper-resistant" on the event list. (B) "Filter by event type, date, actor, run ID, or correlation ID" on the filter panel. (C) "Export to CSV for compliance evidence" on the Export CSV button. |
| **Caption** | "Every mutation is recorded in a durable, append-only audit store. Filter, search, and export events for compliance evidence — 78 typed event types with CI-enforced coverage." |
| **Dark mode variant** | Yes |

### Screenshot 8: Knowledge graph viewer

| Attribute | Detail |
|-----------|--------|
| **Screen** | Graph viewer |
| **URL** | `/graph` |
| **Data state** | Graph loaded for a completed run. Architecture view selected (not provenance). Multiple node types visible — infrastructure elements, requirements, policies as nodes with relationship edges. |
| **Annotation callouts** | (A) "Typed knowledge graph built from your architecture context" on the graph area. (B) "Nodes represent infrastructure, requirements, and policies" near distinct node types. |
| **Caption** | "The knowledge graph visualizes the architecture context as typed nodes and edges — infrastructure elements, requirements, policies, and their relationships — so you can see what the AI agents analyzed." |
| **Dark mode variant** | Yes |

### Screenshot 9: First-run wizard — Pipeline tracking (Step 7)

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard — Step 7 (Track) |
| **URL** | `/reviews/new` (navigate to step 7 after creating a review; legacy `/runs/new` redirects) |
| **Data state** | Pipeline tracking in progress or completed. Progress bar at 75% or 100%. Stage badges showing Context Ready, Graph Ready, Findings Ready, Manifest Ready (or the last one still Pending for the "in progress" feel). |
| **Annotation callouts** | (A) "Live pipeline tracking — no page refresh needed" on the progress bar. (B) "Four stages from context to architecture package" on the stage badges. |
| **Caption** | "After creating a review, the wizard tracks the AI pipeline in real time — context ingestion, graph build, findings generation, and architecture-package synthesis — so you know exactly when your results are ready." |
| **Dark mode variant** | Yes |

### Screenshot 10: Artifact review and DOCX export

| Attribute | Detail |
|-----------|--------|
| **Screen** | Run detail — artifacts section or artifact review page |
| **URL** | `/runs/{runId}` (artifacts table) or `/manifests/{manifestId}` |
| **Data state** | Artifacts table with at least 4–5 rows showing different artifact types (manifest JSON, architecture diagram, decision trace, DOCX report). One artifact row with "Review" and "Download" buttons visible. |
| **Annotation callouts** | (A) "Stakeholder-grade DOCX reports with embedded diagrams" near a DOCX artifact row. (B) "Review artifacts in-browser or download individually" on the Review/Download buttons. (C) "ZIP bundle for the complete evidence package" if bundle download link is visible. |
| **Caption** | "Every run produces reviewable artifacts — manifests, diagrams, decision traces, and consulting-grade DOCX reports — available for in-browser review, individual download, or as a complete ZIP bundle." |
| **Dark mode variant** | Yes |

### Capture checklist

| # | Screen | Light | Dark | Annotated |
|---|--------|-------|------|-----------|
| 1 | Wizard — Preset selection | [ ] | [ ] | [ ] |
| 2 | Wizard — Review step | [ ] | [ ] | [ ] |
| 3 | Run detail with pipeline | [ ] | [ ] | [ ] |
| 4 | Provenance graph | [ ] | [ ] | [ ] |
| 5 | Run comparison | [ ] | [ ] | [ ] |
| 6 | Governance dashboard | [ ] | [ ] | [ ] |
| 7 | Audit event log | [ ] | [ ] | [ ] |
| 8 | Knowledge graph | [ ] | [ ] | [ ] |
| 9 | Wizard — Pipeline tracking | [ ] | [ ] | [ ] |
| 10 | Artifact review / DOCX | [ ] | [ ] | [ ] |

### Output conventions

- **File format:** PNG at 2x resolution (Retina). JPEG acceptable for large screenshots.
- **Naming:** `screenshot-{number}-{slug}-{mode}.png` — e.g., `screenshot-01-wizard-preset-light.png`
- **Annotation style:** Semi-transparent dark overlay badges with white text. Pointer arrows from callout to UI element. Consistent font (system sans-serif or brand font once established).
- **Storage:** Place raw screenshots in `docs/go-to-market/screenshots/` and annotated versions in `docs/go-to-market/screenshots/annotated/`.

**Related for captions / framing:** [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) · [`POSITIONING.md`](POSITIONING.md) · [`BUYER_PERSONAS.md`](BUYER_PERSONAS.md) · [`../library/operator-shell.md`](../library/operator-shell.md) · [`FIRST_RUN_WIZARD.md`](../library/FIRST_RUN_WIZARD.md)

---

## Related documents

| Doc | Use |
|-----|-----|
| [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) | All Docker workflows including demo overlay |
| [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) | Technical demo seed and HTTP verification |
| [`#screenshot-capture-brief`](#screenshot-capture-brief) | Marketing/demo PN