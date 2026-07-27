> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid demo quickstart (buyer-facing), screenshot capture brief for marketing/demo PNGs (formerly `SCREENSHOT_GALLERY.md`), and live-call / video demo scripts plus storyboard (formerly `DEMO_VIDEO_SCRIPT.md`). Full detail, tables, and links in the sections below.

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

**Optional if time remains:** **Compare** two Contoso reviews (`…c501` baseline vs `…c502` hardened) or **Graph** on the opened package. Save **New review** wizard for a longer principal-architect session ([§30-minute principal-architect live script](#30-minute-principal-architect-live-script)).

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

## Demo scripts {#demo-scripts}

Former standalone: `docs/go-to-market/DEMO_VIDEO_SCRIPT.md` → this section (including [two-minute / under-3-minute video storyboard](#two-minute--under-3-minute-video-storyboard)).

Live-call demo scripts for the core pilot path, plus the shot-by-shot storyboard for the first buyer-facing video cut. The **five-minute version** (M-03) opens on a **finished architecture package** — never generation-first. The **30-minute principal-architect variant** adds Graph, Ask, a created-package bridge, and **Compare** between reviewed and created packages. The two-minute version targets async video drop-off. Neither is a promise of marketing artifacts already produced.

### Five-minute live call script (M-03) {#five-minute-live-call-script-m-03}

**Audience:** Prospects and pilot sponsors on a 30-minute discovery or demo call. Use the five-minute version when you have a live product environment and a prospect who has agreed to see the product.

**Grounding:** V1 Pilot layer only. All routes exist in `archlucid-ui` unless noted as conditional. If a capability is behind a feature flag or commercial tier, say "when this is enabled for your tenant" — never imply universal availability.

**Setup:** Run with Simulator agents for a deterministic timeline. Use the Contoso Retail demo tenant (Docker seed) or the static showcase tenant (`claims-intake-modernization`). Have the browser at 1440×900, 100% zoom, bookmarks hidden.

**Demo honesty — Workspace B (M-111 / C4):** When you open the regulated Workspace B sample (`/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b`, Meridian / Alpine), narrate findings as a **seed-backed curated storyline**. Engines are `AiGovernanceSeed` / `SecurityBaselineSeed` — not live Topology / Cost / Compliance / Critic agent traces. Show live multi-agent analysis on **Workspace A** (Product Tour) or a real pilot run. Durable buyer-facing live sample is **M-93** (dogfood).

**Trust ladder:** Open on a **completed architecture package**. Do **not** start at `/reviews/new` or describe generation speed.

#### Opening (0:00–0:30) — Frame the problem

> "I want to show you ArchLucid from first principle — what it actually delivers in practice, not what it looks like in a screenshot.
>
> The problem we are solving: architecture review is one of the slowest, most manual steps in engineering. Teams assemble evidence in wikis and slide decks. Senior architects review everything serially. Decisions are made in meetings and reconstructed months later. And AI tools produce fluent prose with no evidence links, no policy context, no governance trail.
>
> ArchLucid packages that work into a governed **architecture package**: structured findings, explicit confidence limits, a signed manifest, and exports you can hand to an ARB or auditor. Let me show you a finished package first — then we can talk about how new packages enter the same pipeline."

**Visual:** Home or Architecture packages list. No wizard.

#### Scene 1 (0:30–1:15) — Open a finished package

**Route:** `/reviews/claims-intake-modernization` (showcase) **or** Contoso hardened run `6e8c4a102b1f4c9a9d3e10b2a4f0c502` (Docker seed)

> "This is a completed architecture package — not a draft prompt. Status, findings, and manifest linkage are already here because the governed pipeline ran against real intake context.
>
> Notice we are not opening with 'type a prompt and watch it generate.' The value is defensible output: what was examined, what was found, and what was recorded for audit."

**Visual:** Review detail header, summary cards, pipeline complete state. Point to **Reviewed** origin if visible.

#### Scene 2 (1:15–2:15) — Findings, explainability, and explicit limits

**Route:** Findings panel or `/reviews/{runId}/findings/{findingId}`

> "Each finding has severity, confidence, and a recommended action. The differentiator is the explainability trace: what was examined, which rules applied, what evidence was cited, and where confidence stops.
>
> When a finding flags an evidence gap, we say so explicitly — this is not 'the AI always concludes.' Operators can attach counter-evidence and record decisions; that trail stays in the audit log."

**Visual:** Expand one finding trace. Optionally show a finding with an evidence-gap signal.

#### Scene 3 (2:15–3:15) — Architecture package and export

**Route:** Review detail → architecture package summary and artifacts

> "When the architect accepts the package, Finalize produces an architecture package (API: golden manifest): a signed, versioned snapshot of findings, decisions, and artifacts on an append-only audit chain. This is what you hand to your architecture review board — not a chat export.
>
> Artifacts download as Markdown, DOCX, or ZIP. Consulting engagements can whitelabel the DOCX deliverable."

**Visual:** Manifest summary (counts). One artifact row + download.

#### Scene 4 (3:15–4:00) — Creation bridge (one line only)

**Route:** Home → **Open created sample** → `/reviews/northwind-copilot-rag-platform`

> "Creation uses the same governed pipeline — findings, confidence, manifest — not a separate toy path. Here is a **Created** sample package in one click; we do not need to run intake live in a five-minute slot."

**Visual:** **Created** badge on list or detail. Ten-second peek; return to reviewed package if time is tight.

#### Scene 5 (4:00–4:30) — Compare (optional)

**Route:** `/compare` — Contoso baseline vs hardened (`…c501` / `…c502`) when Docker seed is available

> "When designs iterate, compare two packages for structured deltas — findings added, resolved, severity shifts — not a text diff."

**Visual:** Select two packages; highlight delta rows.

#### Closing (4:30–5:00) — Offer

> "What I am offering is this workflow on your real architecture context. The productized engagement is an ArchLucid AI and Cloud Architecture Readiness Review — we apply relevant policy packs and deliver the exported report: findings register, decision record, executive summary.
>
> The next step is usually a 30-minute intake call. Want to set that up?"

#### Q&A prompts (keep on hand)

| Likely question | Suggested answer |
|-----------------|-----------------|
| "How does the AI know our architecture?" | "It doesn't infer it — you describe the request and attach your evidence. The agents analyze what you provide, not what they imagine." |
| "What if a finding is wrong?" | "You annotate it, attach counter-evidence, and record the decision. The trace stays in the audit log." |
| "Is this replacing our architects?" | "No. It removes the manual assembly burden so your senior architects spend time on judgment, not preparation." |
| "What's the governance piece?" | "Policy packs define what rules apply. Pre-finalize gates and approval workflows enforce segregation of duties." |
| "Can we self-host?" | "Yes — Azure-native, Terraform'd infrastructure. For evaluation I can run this as a service so you don't set up first." |

### 30-minute principal-architect live script {#30-minute-principal-architect-live-script}

**Audience:** Enterprise architects evaluating depth — graph traceability, Ask, create-vs-review symmetry, and governance close.

**Grounding:** Same as five-minute script. Use showcase IDs when Docker seed is unavailable.

| Phase | Time | Route(s) | Goal |
|-------|------|----------|------|
| Finished reviewed package | 0:00–8:00 | `/reviews/claims-intake-modernization` | Findings, traces, manifest (same spine as five-minute) |
| Graph + Ask | 8:00–14:00 | `/graph`, `/ask` | Evidence trail and grounded Q&A on the opened package |
| Created package bridge | 14:00–20:00 | Home → `/reviews/northwind-copilot-rag-platform` | Show **Created** origin; same findings/manifest shape (**TB-742**) |
| **Compare reviewed vs created** | 20:00–26:00 | `/compare` | Left: `claims-intake-modernization` (Reviewed); Right: `northwind-copilot-rag-platform` (Created) — structured deltas, not generation speed |
| Governance close | 26:00–30:00 | `/governance` or approval queue | Approval / promotion posture; offer pilot intake |

**Compare talk track:** "Same noun — architecture package — two workflows. Reviewed intake vs born-governed creation. Compare shows semantic drift between packages, not which model typed faster."

**Do not** open this session at `/reviews/new` unless the prospect explicitly asks to see intake live; defer wizard to a follow-up working session.

### Two-minute video script (≈2 minutes) {#two-minute-video-script-2-minutes}

**Audience:** prospects and executive sponsors who cannot self-host the API before a call. **Grounding:** [V1_SCOPE.md](../library/V1_SCOPE.md) Pilot layer only; no V1.1-only connectors.

**Trust ladder:** Open on a **finished package** — not the wizard.

### Storyboard (timing) {#storyboard-timing}

| Time | Scene | Architect workspace route(s) | VO (voiceover, ~300 words total) | Visual |
|------|--------|------------------------------|-----------------------------------|--------|
| 0:00–0:15 | Opening | Marketing or architect home | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns governed intake into auditable architecture packages you can diff and replay." | Split: messy wiki slide vs clean architecture package table (static slide ok). |
| 0:15–0:35 | Finished package | `/reviews/claims-intake-modernization` | "Start from a completed package: status, findings, and architecture package linkage already on screen — not a blank wizard." | Review detail summary; pipeline complete. |
| 0:35–0:55 | Findings + explainability | Finding panel or finding detail | "Findings carry structured traces — what was checked, which rules applied, and where confidence stops." | Expand explainability fields; optional evidence-gap tag. |
| 0:55–1:15 | Package + export | Review detail → architecture package + artifacts | "Finalize produces a signed architecture package (API: golden manifest) and downloadable artifacts — the sponsor-ready package." | Package summary + one download row. |
| 1:15–1:30 | Creation bridge | `/reviews/northwind-copilot-rag-platform` | "Creation follows the same pipeline; here is a Created sample in one click." | **Created** badge; brief. |
| 1:30–1:45 | Compare (optional) | `/compare` | "Compare two packages for structured deltas when designs iterate." | Reviewed vs created or baseline vs hardened. |
| 1:45–1:55 | Governance (if enabled) | `/governance` | "Policy packs and approvals enforce segregation of duties when enabled." | Brief queue screen. |
| 1:55–2:00 | Close | `/why` or home | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | Logo + CTA. |

Trim governance or compare if time is tight — core story is **finished package → findings → manifest → export**.

### Recording instructions {#recording-instructions}

1. **Stack:** Prefer `scripts/demo-start.ps1` / compose **full-stack** with **Simulator** agents so the timeline stays deterministic; use **DevelopmentBypass** locally per [CORE_PILOT.md](../CORE_PILOT.md).
2. **Browser:** Chromium, 1440×900 or 1920×1080, **100%** zoom; hide bookmark bar; dark or light shell consistent throughout.
3. **Data:** Contoso Docker seed for compare pairs; showcase routes `claims-intake-modernization` + `northwind-copilot-rag-platform` for finished-package + creation bridge without seed ([start the demo](#start-the-demo-one-command)).
4. **Audio:** Narrate at ~150 wpm; total VO above is ~260 words → ~1:45; pad with transitions or shorten scenes.
5. **Tools:** OBS Studio or similar; capture **browser** only unless you show CLI; no secrets on screen.

### Acceptance checklist {#demo-script-acceptance-checklist}

- Demos **open on a completed architecture package** — never `/reviews/new` generation-first.
- Five-minute and two-minute scripts include manifest + export; five-minute and 30-minute scripts include **Compare** (30-minute: reviewed vs created).
- Routes exist in **`archlucid-ui`** (App Router segments under `(operator)` / `(marketing)`).
- Claims match **Pilot** capabilities in **[V1_SCOPE.md](../library/V1_SCOPE.md)** §2.
- If a capability is gated (commercial tier / feature flag), voiceover states "when enabled for your tenant" rather than implying universal availability.
- When using **Workspace B**, narrate seed-backed storyline honesty (**M-111**); do not imply live multi-agent traces for that sample.

### Two-minute / under-3-minute video storyboard {#two-minute--under-3-minute-video-storyboard}

**Target length:** Under **3 minutes** for the first buyer-facing cut (core path: wizard → execute → findings → commit; trim governance/compare if over budget). Align narration with the **two-minute video script** section above.

#### Shot table

| Segment | URL / screen | Action | Narration extract | Annotation | Duration (s) |
| --- | --- | --- | --- | --- | ---: |
| Opening | Marketing home or operator home | Hold static frame; optional split slide (wiki chaos vs manifest table) | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns a structured request into governed, auditable outputs you can diff and replay." | Title-safe lower third optional | 15 |
| Create review | `/reviews/new` | Step through wizard; paste 3–4 sentence migration scenario | "An operator starts from a guided flow: system name, constraints, and requirement lines that feed the ingestion pipeline—no mystery prompts." | Highlight structured fields, not a chat box | 20 |
| Execute | Run detail → pipeline timeline | Show stages advancing (simulator or pre-seeded run) | "Execution runs the multi-stage authority pipeline: ingestion, graph, findings, decisioning, artifacts—visible in the UI." | Point to stage labels as each completes | 15 |
| Findings | Run detail findings panel or `/runs/{runId}/findings/{findingId}` | Open one finding; expand explainability trace | "Findings aren't a chat paragraph. Each item carries structured traces you can inspect for what was checked and why." | Show severity, confidence, recommended action | 25 |
| Finalize + package | Review detail → Finalize → Artifacts | Click Finalize; show architecture package summary and one download row | "When ready, Finalize produces an architecture package and downloadable artifacts—the reviewable record for your program." | Emphasize versioned package, not slide deck | 15 |
| Governance (optional) | `/governance` or policy packs | Brief policy or approval screen; skip if not configured | "Policy packs and pre-finalize gates can block promotion when severities exceed thresholds." | Say "when enabled for your tenant" if gated | 15 |
| Compare (optional) | `/compare` | Select two reviews; show structured deltas | "When designs iterate, compare two reviews with structured deltas—not just a text diff." | Trim if total runtime exceeds 2:45 | 15 |
| Close | `/why-archlucid` or home CTA | Logo + contact/signup | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | End card: archlucid.net/contact | 10 |

**Trim order if over 3:00:** Governance → Compare → shorten Opening split slide.

#### Pre-production checklist

- [ ] Staging or local environment with seeded Contoso demo tenant running
- [ ] Browser zoom at 100%, full-screen, clean bookmark bar
- [ ] Loom / Camtasia recording started before narration begins
- [ ] Close all non-ArchLucid browser tabs
- [ ] Test audio quality before recording

#### Post-production checklist

- [ ] Trim dead air at start/end
- [ ] Add title card: **ArchLucid — Defensible architecture, on demand**
- [ ] Add captions for accessibility
- [ ] Upload to Loom or Wistia (not YouTube for sales demo — avoid competitor ads)
- [ ] Add link in [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) and [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)

**Production owner:** TB-236 (screen recording) — deferred until owner returns media per `V1_DEFERRED.md`.

---

## Related documents

| Doc | Use |
|-----|-----|
| [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) | All Docker workflows including demo overlay |
| [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) | Technical demo seed and HTTP verification |
| [`#screenshot-capture-brief`](#screenshot-capture-brief) | Marketing/demo PNG capture brief (10 shots) |
| [`#demo-scripts`](#demo-scripts) | Five-minute / 30-minute live scripts + video storyboard |
