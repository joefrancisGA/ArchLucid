> **Reviewed:** 2026-07-27

> **Scope:** ArchLucid demo quickstart (buyer-facing), screenshot capture brief for marketing/demo PNGs (formerly ``SCREENSHOT_GALLERY.md``), live-call / video demo scripts plus storyboard (formerly ``DEMO_VIDEO_SCRIPT.md``), hosted GA demo workspaces / welcome-hero analytics (formerly the body of ``DEMO_WORKSPACES.md``; that filename remains a path-stable alias for fixture GUID CI), and GTM synthetic samples / architecture review board export how-to (formerly the body of ``samples/README.md``; that filename remains a path-stable alias next to the DOCX/PDF binaries). Full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid demo quickstart (buyer-facing)

**Audience:** Evaluators and champions who want to see the product in minutes without installing the .NET SDK, SQL Server, or Node.js locally. Capture operators also use the [screenshot brief](#screenshot-capture-brief) below.

**Last reviewed:** 2026-07-27

**Grounding:** Same demo data as [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) (Contoso Retail) and [V1_SCOPE.md](../library/V1_SCOPE.md). The Docker path uses **Development** environment, **simulator** agent mode (no Azure OpenAI charges), and **startup demo seed** after DbUp.

---

## Prerequisites

- **Docker Desktop** (Windows or macOS) or **Docker Engine** (Linux)
- That is all â€” no .NET 10 SDK, no local SQL Server, no Node.js for running the stack

---

## Start the demo (one command) {#start-the-demo-one-command}

From the repository root:

| Platform | Command |
|----------|---------|
| **Windows (PowerShell)** | `.\scripts\demo-start.ps1` |
| **macOS / Linux (Bash)** | `./scripts/demo-start.sh` (ensure executable: `chmod +x scripts/demo-start.sh`) |
| **Manual** | `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack up -d --build` |

The script waits up to **120 seconds** for `http://localhost:5000/health/ready`, then opens the architect workspace (where supported).

**Ports used:** 1433 (SQL), 3000 (UI), 5000 (API), 10000â€“10002 (Azurite), 6379 (Redis). Free these before starting if something else is bound.

**API port note:** This Docker **full-stack** profile exposes the API on **5000** (see health URL above). When you run **`ArchLucid.Api`** directly from the repo (e.g. [`OPERATOR_QUICKSTART.md`](../library/customer-facing/OPERATOR_QUICKSTART.md)), the default local port is often **5128** â€” same product, different host binding; do not assume one URL works for both without checking your `launchSettings` / compose maps.

---

## Your first five minutes (finished-package-first)

**Do not open with `/reviews/new` or generation.** Trust ladder: show a **completed architecture package** first, then optionally bridge to creation.

1. **Open a finalized package** â€” From home or **Architecture packages** (`/reviews`), open the seeded **hardened Contoso** review (`6e8c4a102b1f4c9a9d3e10b2a4f0c502` after startup seed; see [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) Â§3) or the static showcase **Claims Intake Modernization** package at `/reviews/claims-intake-modernization` when running UI-only fixtures. You should land on review detail with findings and manifest linkage already present.
2. **Findings and explainability** â€” Open one finding. Walk the structured trace (what was examined, rules applied, evidence cited, confidence limits). Call out an **explicit non-conclusion** or evidence gap when the finding flags missing proof â€” do not imply the AI always concludes.
3. **Finalize / architecture package** â€” Show the signed review record / architecture package summary (finding counts, decision trail). This is the sponsor-ready package, not a chat transcript.
4. **Export** â€” Download Markdown, DOCX, or ZIP from review detail or the export flow (consulting templates may require optional configuration).
5. **Creation bridge (one line)** â€” "Creation follows the same governed pipeline." Optional 30-second peek: home **Open created sample** â†’ `/reviews/northwind-copilot-rag-platform` (**Created** origin badge; see **TB-742**). Do not start the five-minute path there.

**Optional if time remains:** **Compare** two Contoso reviews (`â€¦c501` baseline vs `â€¦c502` hardened) or **Graph** on the opened package. Save **New review** wizard for a longer principal-architect session ([Â§30-minute principal-architect live script](#30-minute-principal-architect-live-script)).

Adjust entry if you prefer the home dashboard at `http://localhost:3000/` â€” still open an existing package, not the wizard.

---

## What you are seeing

- **Architecture Proof Engine** â€” A multi-agent pipeline produces structured findings and a versioned architecture package (reviewed or created); in simulator mode, agents run without calling cloud LLMs.
- **Governance and audit** â€” Policy packs, optional pre-finalize gates, and durable audit patterns match [POSITIONING.md](POSITIONING.md) and [PRODUCT_DATASHEET.md](PRODUCT_DATASHEET.md).
- **Explainability** â€” Findings carry traces suitable for review and audit narratives.

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

- **Timeout on health/ready** â€” Run `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack logs api` and confirm SQL and Azurite are healthy.
- **Port conflicts** â€” Stop other services on 1433, 3000, or 5000, or adjust host port mappings in a **local** override (do not commit port changes unless your team standardizes them).

---

## First-run demo script (simulator)

One narrow buyer scenario using **Simulator** execution â€” not a customer outcome claim.

1. Seed demo data: `dotnet run --project ArchLucid.Cli -- seed-demo-data` (when enabled).
2. Open operator **Home** â†’ complete Core Pilot checklist through commit.
3. Export proof shape: `dotnet run --project ArchLucid.Cli -- pilot proof-packet <demo-run-id> --out artifacts/demo-proof/`
4. Show static packet shape: [`../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only`](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only)

**Expected narrative:** Findings reference policy packs and manifest provenance; banner **demo tenant â€” replace before publishing**; structural execution mode **Simulator** unless real-mode configured. Failure fallback: use buyer-job demo proof shapes (no live tenant). Never invent customer logos, savings percentages, or reference names.

---

## Next steps

- **Production-style pilot:** [Pilot Guide](../library/customer-facing/PILOT_GUIDE.md)
- **Business case:** [ROI_MODEL.md](ROI_MODEL.md) and [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md)
- **Developer / detailed demo seed:** [demo-quickstart.md](../archive/onboarding/demo-quickstart.md)
- **Hosted GA workspaces (anchors + Smoke):** [`#demo-workspaces`](#demo-workspaces) (`DEMO_WORKSPACES.md` alias)
- **Specialty buyer jobs (demo proof shapes):** [`docs/library/walkthroughs/README.md#buyer-jobs-specialty-index`](../library/walkthroughs/README.md#buyer-jobs-specialty-index) (`buyer-jobs/README.md` alias)

---

## Screenshot capture brief {#screenshot-capture-brief}

Former standalone: `docs/go-to-market/SCREENSHOT_GALLERY.md` â†’ this section.

**Audience:** Anyone producing screenshots for the marketing site, sales decks, product documentation, or demo recordings.

This is a **capture brief**: what to show on screen, data state, annotations, and captions. Use a running ArchLucid environment (demo seed recommended) for a consistent set. Save captures under **`docs/go-to-market/screenshots/`** when committing assets.

### Capture prerequisites

- Stack running with **demo seed** â€” use the [Start the demo](#start-the-demo-one-command) path above (`Demo:Enabled=true` / seed on startup).
- Architect workspace at `http://localhost:3000`.
- At least **two completed reviews** with finalized architecture packages (use `archlucid run --quick` twice or Swagger).
- At least **one comparison** between those two reviews (`/compare` or API).
- **One governance approval request** submitted and one approved (if governance is enabled).
- Browser at **1440Ã—900** or **1920Ã—1080**; **light mode** for the primary set, plus **dark mode** variants. Disable extensions that alter page appearance.

### Screenshot 1: First-run wizard â€” Preset selection

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard â€” Step 1 |
| **URL** | `/reviews/new` (legacy `/runs/new` redirects) |
| **Data state** | Fresh page load, no preset selected yet. All three preset cards visible: Greenfield web app, Modernize legacy system, Blank (advanced). |
| **Annotation callouts** | (A) "Choose a starting template or start from scratch" on the preset card area. (B) "Seven guided steps from intent to pipeline" on the stepper indicator. |
| **Caption** | "ArchLucid's guided wizard walks you from a starting template through identity, requirements, constraints, review, and live pipeline tracking â€” in seven steps." |
| **Dark mode variant** | Yes |

### Screenshot 2: First-run wizard â€” Review step

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard â€” Step 6 (Review) |
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
| **Data state** | Review is finalized. Pipeline timeline shows all stages completed (Context, Graph, Findings, Architecture package â€” all with "Ready" badges). Architecture package summary visible below. Artifacts table showing at least 3 rows. |
| **Annotation callouts** | (A) "Real-time pipeline tracking from context to architecture package" on the pipeline timeline. (B) "Versioned architecture package â€” the source of truth" on the package summary. (C) "Review or download individual artifacts" on the artifacts table. |
| **Caption** | "Every review shows its complete pipeline journey â€” from context ingestion through graph build, findings generation, and architecture-package synthesis â€” with artifacts available for review and download." |
| **Dark mode variant** | Yes |

### Screenshot 4: Provenance graph visualization

| Attribute | Detail |
|-----------|--------|
| **Screen** | Provenance graph |
| **URL** | `/runs/{runId}/provenance` |
| **Data state** | Graph loaded for a completed run. Full provenance view selected. Multiple node types visible (snapshots, findings, decisions, manifest, artifacts). Type/color legend visible. |
| **Annotation callouts** | (A) "Visual decision lineage from evidence to artifact" on the graph area. (B) "Color-coded node types: context, findings, decisions, manifest" on the legend. (C) "Click any node to see its detail" near a node. |
| **Caption** | "The provenance graph traces every architecture decision back to the evidence that drove it â€” context snapshots, findings, decision traces, manifest entries, and synthesized artifacts." |
| **Dark mode variant** | Yes |

### Screenshot 5: Run comparison â€” structured deltas

| Attribute | Detail |
|-----------|--------|
| **Screen** | Compare two reviews |
| **URL** | `/compare?leftRunId={id1}&rightRunId={id2}` |
| **Data state** | Two finalized reviews compared. Structured architecture-package deltas visible with additions and changes highlighted. AI explanation section expanded (if available). |
| **Annotation callouts** | (A) "Structured architecture deltas between iterations" on the delta section. (B) "Detect drift before it reaches production" as a summary callout. |
| **Caption** | "Compare any two architecture reviews to see exactly what changed â€” structured architecture-package deltas highlight additions, removals, and modifications with full context." |
| **Dark mode variant** | Yes |

### Screenshot 6: Governance dashboard

| Attribute | Detail |
|-----------|--------|
| **Screen** | Governance dashboard |
| **URL** | `/governance/dashboard` |
| **Data state** | At least one pending approval request visible. Compliance drift chart showing data for the last 30 days (even if sparse). Policy pack change count visible. |
| **Annotation callouts** | (A) "Pending approvals with SLA tracking" on the approval requests section. (B) "Compliance drift trend over time" on the drift chart. (C) "Policy pack activity at a glance" on the change count area. |
| **Caption** | "The governance dashboard gives architects a single view of pending approvals, compliance drift trends, and policy pack activity â€” so nothing falls through the cracks." |
| **Dark mode variant** | Yes |

### Screenshot 7: Audit event log

| Attribute | Detail |
|-----------|--------|
| **Screen** | Audit log |
| **URL** | `/audit` |
| **Data state** | Multiple audit events visible (at least 8â€“10 rows). Filters panel showing event type dropdown, date range, and correlation ID field. Summary line showing "Showing N events." Export CSV button visible. |
| **Annotation callouts** | (A) "78 typed audit event types â€” append-only, tamper-resistant" on the event list. (B) "Filter by event type, date, actor, run ID, or correlation ID" on the filter panel. (C) "Export to CSV for compliance evidence" on the Export CSV button. |
| **Caption** | "Every mutation is recorded in a durable, append-only audit store. Filter, search, and export events for compliance evidence â€” 78 typed event types with CI-enforced coverage." |
| **Dark mode variant** | Yes |

### Screenshot 8: Knowledge graph viewer

| Attribute | Detail |
|-----------|--------|
| **Screen** | Graph viewer |
| **URL** | `/graph` |
| **Data state** | Graph loaded for a completed run. Architecture view selected (not provenance). Multiple node types visible â€” infrastructure elements, requirements, policies as nodes with relationship edges. |
| **Annotation callouts** | (A) "Typed knowledge graph built from your architecture context" on the graph area. (B) "Nodes represent infrastructure, requirements, and policies" near distinct node types. |
| **Caption** | "The knowledge graph visualizes the architecture context as typed nodes and edges â€” infrastructure elements, requirements, policies, and their relationships â€” so you can see what the AI agents analyzed." |
| **Dark mode variant** | Yes |

### Screenshot 9: First-run wizard â€” Pipeline tracking (Step 7)

| Attribute | Detail |
|-----------|--------|
| **Screen** | New run wizard â€” Step 7 (Track) |
| **URL** | `/reviews/new` (navigate to step 7 after creating a review; legacy `/runs/new` redirects) |
| **Data state** | Pipeline tracking in progress or completed. Progress bar at 75% or 100%. Stage badges showing Context Ready, Graph Ready, Findings Ready, Manifest Ready (or the last one still Pending for the "in progress" feel). |
| **Annotation callouts** | (A) "Live pipeline tracking â€” no page refresh needed" on the progress bar. (B) "Four stages from context to architecture package" on the stage badges. |
| **Caption** | "After creating a review, the wizard tracks the AI pipeline in real time â€” context ingestion, graph build, findings generation, and architecture-package synthesis â€” so you know exactly when your results are ready." |
| **Dark mode variant** | Yes |

### Screenshot 10: Artifact review and DOCX export

| Attribute | Detail |
|-----------|--------|
| **Screen** | Run detail â€” artifacts section or artifact review page |
| **URL** | `/runs/{runId}` (artifacts table) or `/manifests/{manifestId}` |
| **Data state** | Artifacts table with at least 4â€“5 rows showing different artifact types (manifest JSON, architecture diagram, decision trace, DOCX report). One artifact row with "Review" and "Download" buttons visible. |
| **Annotation callouts** | (A) "Stakeholder-grade DOCX reports with embedded diagrams" near a DOCX artifact row. (B) "Review artifacts in-browser or download individually" on the Review/Download buttons. (C) "ZIP bundle for the complete evidence package" if bundle download link is visible. |
| **Caption** | "Every run produces reviewable artifacts â€” manifests, diagrams, decision traces, and consulting-grade DOCX reports â€” available for in-browser review, individual download, or as a complete ZIP bundle." |
| **Dark mode variant** | Yes |

### Capture checklist

| # | Screen | Light | Dark | Annotated |
|---|--------|-------|------|-----------|
| 1 | Wizard â€” Preset selection | [ ] | [ ] | [ ] |
| 2 | Wizard â€” Review step | [ ] | [ ] | [ ] |
| 3 | Run detail with pipeline | [ ] | [ ] | [ ] |
| 4 | Provenance graph | [ ] | [ ] | [ ] |
| 5 | Run comparison | [ ] | [ ] | [ ] |
| 6 | Governance dashboard | [ ] | [ ] | [ ] |
| 7 | Audit event log | [ ] | [ ] | [ ] |
| 8 | Knowledge graph | [ ] | [ ] | [ ] |
| 9 | Wizard â€” Pipeline tracking | [ ] | [ ] | [ ] |
| 10 | Artifact review / DOCX | [ ] | [ ] | [ ] |

### Output conventions

- **File format:** PNG at 2x resolution (Retina). JPEG acceptable for large screenshots.
- **Naming:** `screenshot-{number}-{slug}-{mode}.png` â€” e.g., `screenshot-01-wizard-preset-light.png`
- **Annotation style:** Semi-transparent dark overlay badges with white text. Pointer arrows from callout to UI element. Consistent font (system sans-serif or brand font once established).
- **Storage:** Place raw screenshots in `docs/go-to-market/screenshots/` and annotated versions in `docs/go-to-market/screenshots/annotated/`.

**Related for captions / framing:** [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) Â· [`POSITIONING.md`](POSITIONING.md) Â· [`BUYER_PERSONAS.md`](BUYER_PERSONAS.md) Â· [`../library/operator-shell.md`](../library/operator-shell.md) Â· [`FIRST_RUN_WIZARD.md`](../library/FIRST_RUN_WIZARD.md)

---

## Demo scripts {#demo-scripts}

Former standalone: `docs/go-to-market/DEMO_VIDEO_SCRIPT.md` â†’ this section (including [two-minute / under-3-minute video storyboard](#two-minute--under-3-minute-video-storyboard)).

Live-call demo scripts for the core pilot path, plus the shot-by-shot storyboard for the first buyer-facing video cut. The **five-minute version** (M-03) opens on a **finished architecture package** â€” never generation-first. The **30-minute principal-architect variant** adds Graph, Ask, a created-package bridge, and **Compare** between reviewed and created packages. The two-minute version targets async video drop-off. Neither is a promise of marketing artifacts already produced.

### Five-minute live call script (M-03) {#five-minute-live-call-script-m-03}

**Audience:** Prospects and pilot sponsors on a 30-minute discovery or demo call. Use the five-minute version when you have a live product environment and a prospect who has agreed to see the product.

**Grounding:** V1 Pilot layer only. All routes exist in `archlucid-ui` unless noted as conditional. If a capability is behind a feature flag or commercial tier, say "when this is enabled for your tenant" â€” never imply universal availability.

**Setup:** Run with Simulator agents for a deterministic timeline. Use the Contoso Retail demo tenant (Docker seed) or the static showcase tenant (`claims-intake-modernization`). Have the browser at 1440Ã—900, 100% zoom, bookmarks hidden.

**Demo honesty â€” Workspace B (M-111 / C4):** When you open the regulated Workspace B sample (`/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b`, Meridian / Alpine), narrate findings as a **seed-backed curated storyline**. Engines are `AiGovernanceSeed` / `SecurityBaselineSeed` â€” not live Topology / Cost / Compliance / Critic agent traces. Show live multi-agent analysis on **Workspace A** (Product Tour) or a real pilot run. Durable buyer-facing live sample is **M-93** (dogfood).

**Trust ladder:** Open on a **completed architecture package**. Do **not** start at `/reviews/new` or describe generation speed.

#### Opening (0:00â€“0:30) â€” Frame the problem

> "I want to show you ArchLucid from first principle â€” what it actually delivers in practice, not what it looks like in a screenshot.
>
> The problem we are solving: architecture review is one of the slowest, most manual steps in engineering. Teams assemble evidence in wikis and slide decks. Senior architects review everything serially. Decisions are made in meetings and reconstructed months later. And AI tools produce fluent prose with no evidence links, no policy context, no governance trail.
>
> ArchLucid packages that work into a governed **architecture package**: structured findings, explicit confidence limits, a signed manifest, and exports you can hand to an ARB or auditor. Let me show you a finished package first â€” then we can talk about how new packages enter the same pipeline."

**Visual:** Home or Architecture packages list. No wizard.

#### Scene 1 (0:30â€“1:15) â€” Open a finished package

**Route:** `/reviews/claims-intake-modernization` (showcase) **or** Contoso hardened run `6e8c4a102b1f4c9a9d3e10b2a4f0c502` (Docker seed)

> "This is a completed architecture package â€” not a draft prompt. Status, findings, and manifest linkage are already here because the governed pipeline ran against real intake context.
>
> Notice we are not opening with 'type a prompt and watch it generate.' The value is defensible output: what was examined, what was found, and what was recorded for audit."

**Visual:** Review detail header, summary cards, pipeline complete state. Point to **Reviewed** origin if visible.

#### Scene 2 (1:15â€“2:15) â€” Findings, explainability, and explicit limits

**Route:** Findings panel or `/reviews/{runId}/findings/{findingId}`

> "Each finding has severity, confidence, and a recommended action. The differentiator is the explainability trace: what was examined, which rules applied, what evidence was cited, and where confidence stops.
>
> When a finding flags an evidence gap, we say so explicitly â€” this is not 'the AI always concludes.' Operators can attach counter-evidence and record decisions; that trail stays in the audit log."

**Visual:** Expand one finding trace. Optionally show a finding with an evidence-gap signal.

#### Scene 3 (2:15â€“3:15) â€” Architecture package and export

**Route:** Review detail â†’ architecture package summary and artifacts

> "When the architect accepts the package, Finalize produces an architecture package (API: golden manifest): a signed, versioned snapshot of findings, decisions, and artifacts on an append-only audit chain. This is what you hand to your architecture review board â€” not a chat export.
>
> Artifacts download as Markdown, DOCX, or ZIP. Consulting engagements can whitelabel the DOCX deliverable."

**Visual:** Manifest summary (counts). One artifact row + download.

#### Scene 4 (3:15â€“4:00) â€” Creation bridge (one line only)

**Route:** Home â†’ **Open created sample** â†’ `/reviews/northwind-copilot-rag-platform`

> "Creation uses the same governed pipeline â€” findings, confidence, manifest â€” not a separate toy path. Here is a **Created** sample package in one click; we do not need to run intake live in a five-minute slot."

**Visual:** **Created** badge on list or detail. Ten-second peek; return to reviewed package if time is tight.

#### Scene 5 (4:00â€“4:30) â€” Compare (optional)

**Route:** `/compare` â€” Contoso baseline vs hardened (`â€¦c501` / `â€¦c502`) when Docker seed is available

> "When designs iterate, compare two packages for structured deltas â€” findings added, resolved, severity shifts â€” not a text diff."

**Visual:** Select two packages; highlight delta rows.

#### Closing (4:30â€“5:00) â€” Offer

> "What I am offering is this workflow on your real architecture context. The productized engagement is an ArchLucid AI and Cloud Architecture Readiness Review â€” we apply relevant policy packs and deliver the exported report: findings register, decision record, executive summary.
>
> The next step is usually a 30-minute intake call. Want to set that up?"

#### Q&A prompts (keep on hand)

| Likely question | Suggested answer |
|-----------------|-----------------|
| "How does the AI know our architecture?" | "It doesn't infer it â€” you describe the request and attach your evidence. The agents analyze what you provide, not what they imagine." |
| "What if a finding is wrong?" | "You annotate it, attach counter-evidence, and record the decision. The trace stays in the audit log." |
| "Is this replacing our architects?" | "No. It removes the manual assembly burden so your senior architects spend time on judgment, not preparation." |
| "What's the governance piece?" | "Policy packs define what rules apply. Pre-finalize gates and approval workflows enforce segregation of duties." |
| "Can we self-host?" | "Yes â€” Azure-native, Terraform'd infrastructure. For evaluation I can run this as a service so you don't set up first." |

### 30-minute principal-architect live script {#30-minute-principal-architect-live-script}

**Audience:** Enterprise architects evaluating depth â€” graph traceability, Ask, create-vs-review symmetry, and governance close.

**Grounding:** Same as five-minute script. Use showcase IDs when Docker seed is unavailable.

| Phase | Time | Route(s) | Goal |
|-------|------|----------|------|
| Finished reviewed package | 0:00â€“8:00 | `/reviews/claims-intake-modernization` | Findings, traces, manifest (same spine as five-minute) |
| Graph + Ask | 8:00â€“14:00 | `/graph`, `/ask` | Evidence trail and grounded Q&A on the opened package |
| Created package bridge | 14:00â€“20:00 | Home â†’ `/reviews/northwind-copilot-rag-platform` | Show **Created** origin; same findings/manifest shape (**TB-742**) |
| **Compare reviewed vs created** | 20:00â€“26:00 | `/compare` | Left: `claims-intake-modernization` (Reviewed); Right: `northwind-copilot-rag-platform` (Created) â€” structured deltas, not generation speed |
| Governance close | 26:00â€“30:00 | `/governance` or approval queue | Approval / promotion posture; offer pilot intake |

**Compare talk track:** "Same noun â€” architecture package â€” two workflows. Reviewed intake vs born-governed creation. Compare shows semantic drift between packages, not which model typed faster."

**Do not** open this session at `/reviews/new` unless the prospect explicitly asks to see intake live; defer wizard to a follow-up working session.

### Two-minute video script (â‰ˆ2 minutes) {#two-minute-video-script-2-minutes}

**Audience:** prospects and executive sponsors who cannot self-host the API before a call. **Grounding:** [V1_SCOPE.md](../library/V1_SCOPE.md) Pilot layer only; no V1.1-only connectors.

**Trust ladder:** Open on a **finished package** â€” not the wizard.

### Storyboard (timing) {#storyboard-timing}

| Time | Scene | Architect workspace route(s) | VO (voiceover, ~300 words total) | Visual |
|------|--------|------------------------------|-----------------------------------|--------|
| 0:00â€“0:15 | Opening | Marketing or architect home | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns governed intake into auditable architecture packages you can diff and replay." | Split: messy wiki slide vs clean architecture package table (static slide ok). |
| 0:15â€“0:35 | Finished package | `/reviews/claims-intake-modernization` | "Start from a completed package: status, findings, and architecture package linkage already on screen â€” not a blank wizard." | Review detail summary; pipeline complete. |
| 0:35â€“0:55 | Findings + explainability | Finding panel or finding detail | "Findings carry structured traces â€” what was checked, which rules applied, and where confidence stops." | Expand explainability fields; optional evidence-gap tag. |
| 0:55â€“1:15 | Package + export | Review detail â†’ architecture package + artifacts | "Finalize produces a signed architecture package (API: golden manifest) and downloadable artifacts â€” the sponsor-ready package." | Package summary + one download row. |
| 1:15â€“1:30 | Creation bridge | `/reviews/northwind-copilot-rag-platform` | "Creation follows the same pipeline; here is a Created sample in one click." | **Created** badge; brief. |
| 1:30â€“1:45 | Compare (optional) | `/compare` | "Compare two packages for structured deltas when designs iterate." | Reviewed vs created or baseline vs hardened. |
| 1:45â€“1:55 | Governance (if enabled) | `/governance` | "Policy packs and approvals enforce segregation of duties when enabled." | Brief queue screen. |
| 1:55â€“2:00 | Close | `/why` or home | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | Logo + CTA. |

Trim governance or compare if time is tight â€” core story is **finished package â†’ findings â†’ manifest â†’ export**.

### Recording instructions {#recording-instructions}

1. **Stack:** Prefer `scripts/demo-start.ps1` / compose **full-stack** with **Simulator** agents so the timeline stays deterministic; use **DevelopmentBypass** locally per [CORE_PILOT.md](../CORE_PILOT.md).
2. **Browser:** Chromium, 1440Ã—900 or 1920Ã—1080, **100%** zoom; hide bookmark bar; dark or light shell consistent throughout.
3. **Data:** Contoso Docker seed for compare pairs; showcase routes `claims-intake-modernization` + `northwind-copilot-rag-platform` for finished-package + creation bridge without seed ([start the demo](#start-the-demo-one-command)).
4. **Audio:** Narrate at ~150 wpm; total VO above is ~260 words â†’ ~1:45; pad with transitions or shorten scenes.
5. **Tools:** OBS Studio or similar; capture **browser** only unless you show CLI; no secrets on screen.

### Acceptance checklist {#demo-script-acceptance-checklist}

- Demos **open on a completed architecture package** â€” never `/reviews/new` generation-first.
- Five-minute and two-minute scripts include manifest + export; five-minute and 30-minute scripts include **Compare** (30-minute: reviewed vs created).
- Routes exist in **`archlucid-ui`** (App Router segments under `(operator)` / `(marketing)`).
- Claims match **Pilot** capabilities in **[V1_SCOPE.md](../library/V1_SCOPE.md)** Â§2.
- If a capability is gated (commercial tier / feature flag), voiceover states "when enabled for your tenant" rather than implying universal availability.
- When using **Workspace B**, narrate seed-backed storyline honesty (**M-111**); do not imply live multi-agent traces for that sample.

### Two-minute / under-3-minute video storyboard {#two-minute--under-3-minute-video-storyboard}

**Target length:** Under **3 minutes** for the first buyer-facing cut (core path: wizard â†’ execute â†’ findings â†’ commit; trim governance/compare if over budget). Align narration with the **two-minute video script** section above.

#### Shot table

| Segment | URL / screen | Action | Narration extract | Annotation | Duration (s) |
| --- | --- | --- | --- | --- | ---: |
| Opening | Marketing home or operator home | Hold static frame; optional split slide (wiki chaos vs manifest table) | "Enterprise architecture review is still slow, inconsistent, and hard to prove. ArchLucid turns a structured request into governed, auditable outputs you can diff and replay." | Title-safe lower third optional | 15 |
| Create review | `/reviews/new` | Step through wizard; paste 3â€“4 sentence migration scenario | "An operator starts from a guided flow: system name, constraints, and requirement lines that feed the ingestion pipelineâ€”no mystery prompts." | Highlight structured fields, not a chat box | 20 |
| Execute | Run detail â†’ pipeline timeline | Show stages advancing (simulator or pre-seeded run) | "Execution runs the multi-stage authority pipeline: ingestion, graph, findings, decisioning, artifactsâ€”visible in the UI." | Point to stage labels as each completes | 15 |
| Findings | Run detail findings panel or `/runs/{runId}/findings/{findingId}` | Open one finding; expand explainability trace | "Findings aren't a chat paragraph. Each item carries structured traces you can inspect for what was checked and why." | Show severity, confidence, recommended action | 25 |
| Finalize + package | Review detail â†’ Finalize â†’ Artifacts | Click Finalize; show architecture package summary and one download row | "When ready, Finalize produces an architecture package and downloadable artifactsâ€”the reviewable record for your program." | Emphasize versioned package, not slide deck | 15 |
| Governance (optional) | `/governance` or policy packs | Brief policy or approval screen; skip if not configured | "Policy packs and pre-finalize gates can block promotion when severities exceed thresholds." | Say "when enabled for your tenant" if gated | 15 |
| Compare (optional) | `/compare` | Select two reviews; show structured deltas | "When designs iterate, compare two reviews with structured deltasâ€”not just a text diff." | Trim if total runtime exceeds 2:45 | 15 |
| Close | `/why-archlucid` or home CTA | Logo + contact/signup | "Every recommendation traced. Every decision governed. Start a pilot on your terms." | End card: archlucid.net/contact | 10 |

**Trim order if over 3:00:** Governance â†’ Compare â†’ shorten Opening split slide.

#### Pre-production checklist

- [ ] Staging or local environment with seeded Contoso demo tenant running
- [ ] Browser zoom at 100%, full-screen, clean bookmark bar
- [ ] Loom / Camtasia recording started before narration begins
- [ ] Close all non-ArchLucid browser tabs
- [ ] Test audio quality before recording

#### Post-production checklist

- [ ] Trim dead air at start/end
- [ ] Add title card: **ArchLucid â€” Defensible architecture, on demand**
- [ ] Add captions for accessibility
- [ ] Upload to Loom or Wistia (not YouTube for sales demo â€” avoid competitor ads)
- [ ] Add link in [`PRODUCT_DATASHEET.md`](PRODUCT_DATASHEET.md) and [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)

**Production owner:** TB-236 (screen recording) â€” deferred until owner returns media per `V1_DEFERRED.md`.

---

## Demo workspaces {#demo-workspaces}

Former standalone body: `docs/go-to-market/DEMO_WORKSPACES.md` → this section (filename kept as a path-stable alias for GUID CI / smoke pins).

**Last reviewed:** 2026-07-26

## Cross-navigation (marketing + onboarding)

| Surface | Workspace | Repository wiring |
|---------|-----------|-------------------|
| **Landing / welcome — secondary CTA “Try the self-demo”** (improvement **#32**) | **Workspace A** (product tour run) | `archlucid-ui`: [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), [`build-self-demo-cta-href.ts`](../../archlucid-ui/src/lib/marketing/build-self-demo-cta-href.ts), env **`NEXT_PUBLIC_SELF_DEMO_URL`** — defaults to legacy `/runs/{ProductTour}` which **301**s to **`/reviews/...`** (see below). Deployments should set **`NEXT_PUBLIC_SELF_DEMO_URL`** explicitly for staging/production hostnames when it must be absolute. |
| **Post-registration onboarding** — “Open example review” | Runs returned as **`trialSampleRunId`** | [`OnboardingStartClient.tsx`](../../archlucid-ui/src/components/OnboardingStartClient.tsx) surfaces **`GET /v1/tenant/trial-status`** (`trialSampleRunId`). Coordinators align trial bootstrap with **`DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId`** when hosted evaluators should hit the canonical Product Tour run. |
| **No dedicated second onboarding deep link today** | **Workspace B** (regulated storyline) | **Sales / CS / marketing** bookmark or email the **Workspace B canonical URL pattern** (`/reviews/{runId}` in this doc). Owners may add explicit copy or CTAs linking Workspace B alongside Workspace A once **#32** copy review extends onboarding. |

**Operational alignment:** when trial tenants use a different seeded sample than the Product Tour, document the tenant’s actual **`trialSampleRunId`** next to **`NEXT_PUBLIC_SELF_DEMO_URL`** in the deployment runbook so Sales and onboarding scripts stay truthful.

---

## Welcome hero — CTAs, analytics, and compliance {#welcome-hero--ctas-analytics-and-compliance}

**Code:** [`archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx`](../../archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx) (layout + copy), primary [`WalkthroughRequestCta.tsx`](../../archlucid-ui/src/components/marketing/WalkthroughRequestCta.tsx), secondary [`SelfDemoRequestCta.tsx`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx), tertiary [`HeroEarlyAccessCta.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.tsx). Analytics helpers: [`marketing-clarity-custom-event.ts`](../../archlucid-ui/src/lib/marketing/marketing-clarity-custom-event.ts).

**Public FAQ (bulk upload ≤30 files, demo workspaces):** in-app route **`/faq`** (`archlucid-ui/src/app/(marketing)/faq/page.tsx`).

### Microsoft Clarity — custom events (staging / production)

Events fire only when:

1. The visitor has **accepted** marketing analytics on the consent banner (`localStorage` key `archlucid.marketingAnalyticsConsent.v1` = `granted`), and  
2. Clarity is loaded (`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID` set — see [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md)).

| Event | When it fires | UTM on the event |
|--------|----------------|------------------|
| **`cta_walkthrough_click`** | **Click** on primary **Request walkthrough** (before navigation) | `cta_utm_source`, `cta_utm_medium`, `cta_utm_campaign` set from current page query when non-empty; `cta_source` = `hero` |
| **`cta_self_demo_click`** | **Click** on secondary **Try the self-demo** | Same UTM dimensions |
| **`cta_early_access_submit`** | **After** successful **`POST /v1/marketing/early-access`** (HTTP success) — **not** when opening the inline form or on click | Same UTMs plus optional `cta_email_domain` (domain only, lowercase) |

**Manual verification (staging):** land with `?utm_source=test&utm_medium=email&utm_campaign=hero`; accept cookies/consent; use browser devtools / Clarity dashboard to confirm dimensions and event names. **`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`** must be configured for the environment under test.

**Automated verification (CI):** Vitest mocks `window.clarity` + consent — [`marketing-clarity-custom-event.test.ts`](../../archlucid-ui/src/lib/marketing/marketing-clarity-custom-event.test.ts), [`marketing-hero-cta-clarity.wiring.test.tsx`](../../archlucid-ui/src/components/marketing/marketing-hero-cta-clarity.wiring.test.tsx), [`HeroEarlyAccessCta.test.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.test.tsx).

### Configuration (deployment)

Document per-environment values in your runbook; canonical variable list lives in **[`archlucid-ui/.env.example`](../../archlucid-ui/.env.example)**.

| Variable | Purpose |
|----------|---------|
| **`NEXT_PUBLIC_WALKTHROUGH_BOOKING_URL`** | Primary CTA target (booking URL); UTMs appended. If unset, CTA uses **mailto** (optional **`NEXT_PUBLIC_WALKTHROUGH_MAILTO_FALLBACK`**). |
| **`NEXT_PUBLIC_SELF_DEMO_URL`** | Secondary CTA target — prefer **Workspace A** path (see this document); UTMs appended. |
| **`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`** | Optional; enables Clarity after explicit consent. |

**CD / pipeline context:** [`../library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md) — UI ships with the same Next bundle; marketing env vars are **build-time** `NEXT_PUBLIC_*` for the web app image.

### Copy / legal checklist (hero)

| Check | Status (intent) |
|-------|------------------|
| **Early access** | Form disclosure states conversation / follow-up — **not** instant product access, **not** checkout, **not** walkthrough-led pilot parity ([`HeroEarlyAccessCta.tsx`](../../archlucid-ui/src/components/marketing/HeroEarlyAccessCta.tsx)). |
| **No hero dollar pricing / 90-day pilot band** | Hero does not quote purchasable pilot **$** amounts or promotional 90-day pricing; packaging remains **sales-qualification** paths and links to **`/pricing`** / trial elsewhere. |
| **Self-demo** | Tooltip + microcopy: **synthetic / fabricated data** only ([`SELF_DEMO_HERO_DISCLOSURE_COPY`](../../archlucid-ui/src/components/marketing/SelfDemoRequestCta.tsx)). |
| **FAQ cross-links** | **`/faq#bulk-upload-30-files`**, **`/faq#demo-workspaces`** under tertiary CTA. |
| **Footer / attribution** | No third-party **marketing** footer requirement beyond site chrome; **Clarity** disclosure: [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md). |

### Explicitly out of scope on `/welcome`

- **No** public **paid-pilot price band** on the hero.
- **No** “Buy now” or **self-serve checkout** CTA on the landing hero.
- **No** Stripe Checkout path from the welcome hero (deferred per procurement backlog **#7** / **P4**); see [`STRIPE_CHECKOUT.md`](STRIPE_CHECKOUT.md) for product stance.

### Playwright (optional smoke)

**Mock E2E** (`playwright.mock.config.ts`): [`marketing-public-pages-smoke.spec.ts`](../../archlucid-ui/e2e/marketing-public-pages-smoke.spec.ts) — welcome hero CTAs, self-demo navigation, early access thanks with proxied **`POST`** stub.

Run: `npx playwright test e2e/marketing-public-pages-smoke.spec.ts -c playwright.mock.config.ts` (after mock webServer per [`archlucid-ui/README.md`](../../archlucid-ui/README.md)).

Former standalone: `docs/go-to-market/WELCOME_HERO_CTA_ANALYTICS.md` → this section.

---

## Setup (anonymous demo viewer)

When **`Demo:AnonymousViewer:Enabled = true`**, the Contoso trusted-baseline seed is applied automatically on API startup (`DemoSeedStartupHostedService`). A fresh demo host serves **`GET /v1/demo/explain`** without a manual **`POST /v1/demo/seed`** or **`archlucid try`** first. Seed failure is logged at **Warning** and does **not** crash startup — retry with the manual seed endpoint if `/demo/explain` still returns 404.

Requires **`Demo:Enabled = true`** alongside **`Demo:AnonymousViewer:Enabled`**. Development compose stacks may also seed via **`Demo:SeedOnStartup`** (see **[demo quickstart](#start-the-demo-one-command)**); both paths are idempotent.

---

## Staging / production URLs (patterns and owner-owned hosts)

Repositories **must not bake in** unpublished customer hostnames. Use this pattern everywhere; release managers paste the **`{OPERATOR_ORIGIN}`** your environment actually serves (matching architect workspace HTTPS origin).

| Workspace | Canonical path (recommended) |
|-----------|--------------------------------|
| **A — Product Tour** | `{OPERATOR_ORIGIN}/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| **B — Regulated synthesis** | `{OPERATOR_ORIGIN}/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

| Environment | **`{OPERATOR_ORIGIN}`** (fill per deployment — examples only) |
|-------------|--------------------------------------------------------------|
| **Local compose / dev** | `http://localhost:3000` (UI) matching [demo quickstart](#start-the-demo-one-command). |
| **Staging** | **`https://<your-staging-operator-host>`** — record canonical operator origin in **`docs/`** deployment notes when you cut a staging lane (see also [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md), post-deploy **`SMOKE_TEST_BASE_URL`** where applicable). |
| **Production** | **`https://<your-production-operator-host>`** — same; GA tagging requires **`ui-e2e-live`** (and **`@release-gate`**) green on candidate builds (**[`docs/engineering/BUILD.md`](../engineering/BUILD.md)**). |

**Legacy shorthand:** **`{OPERATOR_ORIGIN}/runs/<run-guid>` → 301 `/reviews/<run-guid>`** — safe for outbound ads that still omit `/reviews/`.

---

## Tenant bootstrap (Sales + Marketing)

Shared facts for both workspaces — default development scope tenant **`11111111-1111-1111-1111-111111111111`**, workspaces/projects in each section below seed under **`DevelopmentDefaultScopeTenantBootstrap`** + **`DemoSeedService`** when **ArchLucid.Api** runs **`ASPNETCORE_ENVIRONMENT=Development`** (Compose demo profile mirrors this posture per [demo quickstart](#start-the-demo-one-command)).

| Role | Responsibility |
|------|----------------|
| **Platform / engineer** | Run DbUp migrations, start API against SQL, **`AgentExecution__Mode=Simulator`** for cheap CI/staging rehearsals. Confirm demo seed paths execute (**`DemoSeedService`**, Meridian/Alpine + Product Tour workspaces). Smoke: **`npm exec playwright test --grep "@release-gate"`** in **`archlucid-ui`** with API at **`LIVE_API_URL`** (see **[`docs/engineering/BUILD.md`](../engineering/BUILD.md)**). |
| **Sales** | Use **bookmark deep links** and **confirm scope picker** aligns to the advertised workspace (**Product Tour**, **Alpine governance review**) — wrong workspace/project hides fixtures (scope triplet documented per workspace below). Optionally drive evaluators via landing **Try the self-demo** (Workspace A only). Workspace B stays a **consultant/regulated wedge** narration link until onboarding adds explicit UI. |
| **Marketing** | Set **`NEXT_PUBLIC_SELF_DEMO_URL`** for Workspace A (**relative path preferred**, or absolute **`https`** URL on production). Maintain copy consistency with onboarding **trial sample** wording; cite **synthetic entities only** (**Northwind / Contoso / Meridian / Alpine** — no implied real customers). Link this doc from internal playbooks alongside **[`POSITIONING.md`](POSITIONING.md)**. |

---

## Resetting / re-seeding (staging refreshes)

1. **`docker compose`** local demo stacks: tear down volumes per **[demo quickstart](#start-the-demo-one-command) — Cleanup**, then rerun **`scripts/demo-start.ps1`** / **`demo-start.sh`** (applies migrations + bootstrap seed paths).
2. **Dedicated staging SQL catalogs:** recreate empty DB (or migrate from known baseline), rerun latest pipeline deploy so **Development** staging paths execute **`DemoSeedService`** for default tenant workspaces; verify `/health/ready` then hit both canonical URLs scoped with headers below.
3. **Operational refresh without repo changes:** restarting API/SQL alone does **not** guarantee fresh findings — deterministic GUIDs intentionally remain stable (`DemoWorkspaceStableIds`). For **content** updates edit **`ArchLucid.Application/Bootstrap`** (`DemoSeedService`, `RegulatedScenarioWorkspaceSeed`, Product Tour payloads) following **living fixture** discipline (next section).

---

## Living fixtures — maintenance and PR discipline

GA evaluators rely on **`archlucid-ui/e2e/demo-workspace-*.smoke.spec.ts`** (tag **`@release-gate`**, merge-blocking via **`.github/workflows/ci.yml`** `ui-e2e-live` and **`docs/engineering/BUILD.md`**).

1. **Living fixtures:** Demo workspaces diverge silently when UX or wire shapes change (**evidence model**, finding cards, buyer shell nav, exports, Markdown/DOCX surfaces, manifest summary fields, timeline/progress instrumentation, policy/rule display). Passing core unit/integration tests is **not** sufficient if smoke drifts.

2. **Co-change rule:** Any PR materially touching **finding display**, **evidence summaries**, **export formats/endpoints consulted by smoke**, **policy-pack evaluation payloads that seed manifests**, **run-detail section IDs / buyer nav anchors**, **or persisted export JSON shape** MUST:
   - Re-run **`cd archlucid-ui`** → **`npm exec playwright test --grep "@release-gate"`** (or full live suite) against seeded SQL Development paths, **or** justify with maintainer escalation if CI flakes are infra-only.

3. **Seed format churn:** Persisted manifests, **`RunExportRecords`**, or **`dbo.Runs`/workspace rows** mutated for demo storytelling require **matching updates** under **`DemoSeedService`**, seeds, **`DemoWorkspaceStableIds` parity tests**, **`DemoTourWorkspaceIdsParityTests` / `DemoRegulatedScenarioWorkspaceIdsParityTests`**, **`DemoWorkspaceFixtureManifestParityTests`**, **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`**, and **`archlucid-ui/e2e/helpers/demo-workspace-live-scope.ts`** (imports the manifest) in the **same PR** whenever anchor IDs/content move.

### Pinned fixture package (SQL + blob narrative seeds)

Evaluator URLs and Playwright/release-smoke anchors are driven from one JSON manifest:

- **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`** — `fixturePackageVersion`, stable GUIDs for Workspace **A** / **B**, **expectedCommittedFindingCount** (matches `ProductTourWorkspaceSeed` / `RegulatedScenarioWorkspaceSeed` builders), and evidence-object counts used for GA drift detection.

**Update procedure when product intentionally changes demo seeds**

1. Edit **`DemoSeedService`** / **`ProductTourWorkspaceSeed`** / **`RegulatedScenarioWorkspaceSeed`** (and **`DemoWorkspaceStableIds`** only when anchors truly move — rare).
2. Bump **`fixturePackageVersion`** and adjust **`expectedCommittedFindingCount`** / evidence counts in the manifest so **`DemoWorkspaceFixtureManifestParityTests`** stays green.
3. Align **`docs/go-to-market/DEMO_QUICKSTART.md#demo-workspaces`** tables and scope triplets with the manifest (CI runs **`scripts/demo-workspaces/Validate-DemoWorkspacesDoc.ps1`** and **`demo-workspaces-fixture-parity`**).
4. Re-run **`@release-gate`** Playwright smoke (**`demo-workspace-*.smoke.spec.ts`**) and **`scripts/release-smoke.ps1 -LivePlaywright`** (or **`-Profile LiveUiSql`**) against Development SQL.

See also **[`docs/library/RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md)** and **`scripts/release-smoke.ps1 -LivePlaywright`**.

---

## Synthetic naming and PII hygiene

All strings are **fabricated** (Northwind, Contoso Cloud Platform, Meridian Advisory Group, Alpine Health Innovations cohort language). Classification tags (**HIPAA-aligned-synthetic**, **PHI-prohibited-evaluator**) are **narrative only** — there is **no real PHI / regulated payload** carried in seeded demo rows intended for evaluator tenants.

Periodic contributor spot-check:

```powershell
# From repo root — extend patterns thoughtfully for your org's PII fingerprints.
rg -n "\\b@gmail\\.com\\b|\\b(contoso\\.com|fabrikam\\.com)\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b" docs/go-to-market ArchLucid.Application/Bootstrap
```

If you add realism, prefer clearly fake domains (**`*.example`** / **`northwind-demo`**) documented here.

---

## Operator Overview (authenticated home)

**TB-1039:** When the active scope is a **pinned demo workspace** (Workspace A/B project/workspace GUIDs from the fixture manifest), the **Claims Intake Demo** buyer label, or local **dev-default** Claims Intake scope, an empty Overview must not look like a blank customer tenant:

1. Runs list uses the **scoped demo `projectId`** (not bare `default`) when the pin is Workspace A/B.
2. If the list is still empty, the **browser** Overview injects the **canonical sample architecture package** row (Workspace A/B run GUID, or Claims Intake showcase `claims-intake-modernization`). Injection is **client-only** (not SSR) so production empty tenants never stick a fake row from DEV-default server scope.
3. Empty-home **Do this next** leads with **Open sample package** (setup blockers skipped for demo/seeded pins). Injected rows do **not** count as real workspace reviews for empty-home gating.

Real empty customer tenants (non-demo scope IDs / labels) keep TB-1036 / TB-1038 empty-tenant behavior. Implementation: `archlucid-ui/src/lib/demo-seeded-overview.ts`.

---

## Acceptance criteria checklist (demo workspace readiness)

Use this checklist before tagging **GA / external pilot freeze** aligned with historical GA task prompts (see [`CHANGELOG.md`](../CHANGELOG.md) — 2026-04 release-candidate sequence).

- [ ] **Golden demo validation:** `./scripts/verify-demo-workspace.ps1` reports **`Demo workspace disposition: PASS`** (or documented **HOLD** with stable reason codes) including **`GET /v1/demo/preview`** essentials via `scripts/demo_preview_essentials.py`. First-pilot proof collects `demo-workspace-validation.txt` when commercial handoff runs.

- [ ] **Demo-derived ROI labeling:** First-value reports for demo runs include **Demo-derived** evidence badges — never present demo hours or dollars as buyer outcomes.

- [ ] **`demo-workspaces-fixture-parity` + manifest pins:** Workflow job **`Go-to-market: demo workspace pins (manifest vs docs + seeds)`** green — validates **`DEMO_QUICKSTART.md#demo-workspaces`** (alias `DEMO_WORKSPACES.md`) anchors vs **`fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json`** and runs **`DemoWorkspaceFixtureManifestParityTests`** (finding/evidence counts vs seed builders). Branch protection should require this job wherever GA is certified.

- [ ] **`@release-gate` discipline:** **`ui-e2e-live`** executes **`demo-workspace-*.smoke.spec.ts`** when it runs (**`ci.yml`**: job `if:` is **`github.event_name != 'pull_request`** — **`push`** to default branch / **`workflow_dispatch`** / **`merge_group`**, depending on triggers). Confirm org branch protection attaches that check wherever you certify GA. Before tagging, additionally run **`cd archlucid-ui`** → **`npm exec playwright test --grep "@release-gate"`** and **`scripts/release-smoke`** live parity when claiming SQL/UI alignment.

- [ ] **PII realism:** Hosted copy + seeds contain **only synthetic** firms and placeholders; onboarding and trial docs point here for naming truth.

- [ ] **Fixture drift signal:** Breaking UI/API expectations without updating seeds/smoke manifests as **`@release-gate` failures**, forcing fixture repair (not muted checks).

- [ ] **Documented anchors:** Stable URL patterns (**above**), scope triplets (**per workspace**), bootstrap (**Sales + Marketing**) — this file stays the canonical cross-link target for onboarding/landing (**#31 / #32**).

---

## Workspace A — Self-demo / Product Tour

**Demonstrates:** A complete **architecture review lifecycle** narrative for skeptical buyers (**Capture → Evidence → Review → Assessment → Deliverables**) on a finalized synthetic **Contoso Cloud Platform** storyline — evidence basis cards, surfaced findings with severity-backed badges, a **Finalized decision record** posture, packaged deliverables (ZIP/markdown/export affordances) without implying real-customer attestations — ideal for **`NEXT_PUBLIC_SELF_DEMO_URL`** + landing **Try the self-demo**.

**Audience:** Buyers who activate **Try the self-demo** (marketing CTA).

**Synthetic storyline:** Northwind Architects (fabricated reviewer) reviews **Contoso Cloud Platform**. All artifacts, subscriptions, and customer names are **synthetic**.

**Committed review run (`dbo.Runs`):** deterministic GUID **`b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf`** (see `DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId` in **`ArchLucid.Core.Scoping`**).

### Stable UI entry URLs

Next.js redirects legacy **`/runs/*`** to **`/reviews/*`** (`archlucid-ui/next.config.ts`). Use the review shell path for bookmarks and campaigns.

| Variant | Pattern |
|---------|---------|
| **Canonical reviewer deep link** | `{UI_ORIGIN}/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| **Legacy / marketing shorthand** (`NEXT_PUBLIC_SELF_DEMO_URL`) | `{UI_ORIGIN}/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` → **301** to `/reviews/...` |

Replace `{UI_ORIGIN}` with your host (local demo: typically `http://localhost:3000`).

### API / scope headers (mandatory triplet)

Run rows are SQL-scoped by **tenant**, **workspace**, and **scope project**. The shell forwards scope on `/api/proxy` via **`x-tenant-id`**, **`x-workspace-id`**, and **`x-project-id`**. Opening `/reviews/{runId}` **without** the matching workspace/project still targets the HTTP default scope (`ScopeIds`), so listings and run detail loads may **miss** the Product Tour fixtures.

For **Workspace A**, align headers (or JWT claims interpreted the same way) to:

| Header | Stable GUID (`ScopeIds.DefaultTenant` environment) |
|--------|-----------------------------------------------------|
| `x-tenant-id` | `11111111-1111-1111-1111-111111111111` |
| `x-workspace-id` | `2b2571e1-1884-62a2-1e8b-15a2a70a0342` |
| `x-project-id` | `9beb918c-83d4-1385-0486-21f341806c5c` |

Local architects can pick **Product Tour — Architecture Review** in the Scope Switcher (`archlucid-ui`); integrations should set the triple explicitly.

Unit coverage: **`DemoTourWorkspaceIdsParityTests`** must match **`DemoWorkspaceStableIds`** literals so marketing anchors never drift silently.

### `IsDemoWorkspace` and billing posture

Development bootstrap inserts **`dbo.TenantWorkspaces.IsDemoWorkspace = 1`** for the Product Tour workspace when migration **`166`** (or **`ArchLucid_Unified_Schema.sql`** parity fragment) deployed the flag. Seeds also tag that workspace so **SKU metering** can exclude scripted fixtures once product code honors the column.

### Read-only stance for evaluators

Today, **enforce read-only evaluator access** operationally (**Entra roles / RBAC**, product role matrix, trial policy) rather than trusting UI alone. Synthetic rows remain authoritative for the storyline; cloning onto non-default tenants is intentionally gated in **`DemoSeedService`** (requires **`ScopeIds.DefaultTenant`** unless product widens seeding intentionally).

---

## Workspace B — Synthetic regulated / AI governance scenario

**Demonstrates:** A **consultant-led regulated AI + security baseline** walkthrough — heavier cross-cutting findings sourced from **AI governance** and **security baseline** seed themes, **whitelabel export pre-fill** JSON on persisted export records, and executive-safe language about sensitive domains **without** hosting real PHI — ideal for **boutique / compliance** evaluators who need “show me the finding depth” before a pilot.

**Audience:** Evaluators who need a **regulated, AI-era governance** walkthrough with heavier findings and **consultant whitelabel** export hints.

**Synthetic storyline:** **Meridian Advisory Group** (fabricated consultant) delivers **Alpine Health Innovations — Patient Risk Scoring Platform** review. **No PHI, PII, or real regulated payloads** — classification tags and “patient” language are narrative only.

**Committed review run (`dbo.Runs`):** **`61c60d76-2b80-93f9-46bb-2f66fd608b9b`** (`DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId`).

### Stable UI entry URL

| Pattern | Example |
|---------|---------|
| **Canonical reviewer deep link** | `{UI_ORIGIN}/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` |

### Scope headers (mandatory triplet)

Runs are filtered by tenant + workspace + project. Use:

| Header | GUID |
|--------|------|
| `x-tenant-id` | `11111111-1111-1111-1111-111111111111` |
| `x-workspace-id` | `3f1a16c3-172e-5632-c53a-3ed16446f603` |
| `x-project-id` | `49074cdf-bdab-a5fa-789b-09a3e556a8f2` |

SQL workspace display name: **AI Governance Review — Patient Risk Scoring Platform**. Project slug (`dbo.Projects.Name`): **`alpine-ai-governance-review`**.

### Whitelabel + export pre-fill

Seeded **`dbo.RunExportRecords`** for Workspace B stores **`AnalysisRequestJson`** with **`PersistedAnalysisExportRequest`**, including:

| JSON field | Intended use |
|------------|----------------|
| **`reviewBoardWhitelabelFirmDisplayName`** | Meridian Advisory Group |
| **`reviewBoardWhitelabelClientEngagementTitle`** | Alpine Health — AI Governance Engagement |
| **`reviewBoardWhitelabelLogoBlobReference`** | Opaque placeholder pointer (resolve to bytes in tenant storage for real PDF/DOCX) |
| **`reviewBoardWhitelabelFooterAttribution`** | Custom footer line with `{FirmDisplayName}` placeholder |

**Architecture review board packets** (`IArchitectureReviewExportService.GenerateReportAsync`) still require callers to pass **`WhitelabelConfiguration`** + optional logo bytes — the stored JSON is the **evaluator pre-fill** contract for tools and future UI. Artifact bundle markdown under the run also mirrors the same strings for human-readable tours.

Coverage: **`DemoRegulatedScenarioWorkspaceIdsParityTests`**, **`DemoSeedServiceTests.SeedAsync_seeds_workspace_b_regulated_scenario_with_whitelabel_export_hints`**.

---

## GTM samples and architecture review board export {#gtm-samples}

Former standalone body: `docs/go-to-market/samples/README.md` → this section (filename kept as a path-stable alias beside the binary samples). Not customer exports, signed legal deliverables, or authoritative product specs.

Sanitized artifacts for procurement, landing pages, and format previews. Buyer-facing vocabulary follows [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](../library/CONCEPT_VOCABULARY.md#ui-glossary-v1) (improvement #27).  
**Path-stable alias:** [`samples/README.md`](samples/README.md).

### Architecture review board packet (DOCX/PDF) {#architecture-review-board-export}

Former standalone: `docs/go-to-market/ARCHITECTURE_REVIEW_BOARD_EXPORT.md` → this section.

| File | Description |
|------|-------------|
| [`samples/architecture-review-report-sample.docx`](samples/architecture-review-report-sample.docx) | Fictitious **Contoso Architecture Partners** / **Northwind Corp** whitelabel; placeholder logo. |
| [`samples/architecture-review-report-sample.pdf`](samples/architecture-review-report-sample.pdf) | PDF parity for the same synthetic model. |

**Data hygiene:** samples must remain synthetic; do not substitute customer exports without legal review. These files contain **no customer data**.

#### How to trigger export

##### Architect workspace (today)

1. Open a **review** from **Reviews** (`/reviews`, `/reviews/{runId}`).
2. **Finalize** the architecture package when the architecture snapshot is ready (buyer-facing language for API `commit`).
3. On the review detail page, open **Artifacts & exports** (or **Deliverables** in buyer-polished architect workspace).
4. **Consulting DOCX:** use **Export to DOCX** when your principal includes `export:consulting-docx` — this uses the consulting analysis template, not the architecture review board packet described here.
5. **Architecture review board packet (DOCX/PDF):** generation is implemented in application code (`IArchitectureReviewExportService`). Dedicated UI controls and a versioned HTTP download mirroring consulting exports may ship in a follow-on; hosts with internal composition can invoke the service directly (see below).

Vocabulary for labels and headings aligns with [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](../library/CONCEPT_VOCABULARY.md#ui-glossary-v1): **Review**, **Finalize review**, **Architecture snapshot**, **Evidence graph** (UI) vs run/commit/manifest/knowledge graph (technical).

##### API (consulting DOCX — live surface)

```http
POST /v1/architecture/run/{runId}/analysis-report/export/docx/consulting HTTP/1.1
Authorization: Bearer …
Content-Type: application/json

{}
```

Use the same tenancy, correlation id, and API gateway patterns as other `/v1/architecture/*` calls. Response is a `*.docx` attachment.

##### Application entry (architecture review board packet)

For the **architecture-review-board** profile (nine-section packet, glossary-aligned headings):

- Inject **`IArchitectureReviewExportService`** and call **`GenerateReportAsync(runId, ExportFormat.Docx | ExportFormat.Pdf, whitelabel, logoBytes, httpCorrelationId, cancellationToken)`**.
- Preconditions enforced by the service: review exists, architecture snapshot loadable, **`IsCommitted`** (finalized review). Errors surface as **`RunNotFoundException`**, **`ConflictException`** (broken snapshot reference or not finalized).

Wire token for audits/metadata: **`architecture-review-board`** (`ArchitectureReviewBoardExportProfile.Token`).

#### Whitelabel (consultants)

Pass a non-null **`WhitelabelConfiguration`**:

| Field | Purpose |
|-------|---------|
| **`FirmDisplayName`** | Cover title line (consulting firm). |
| **`ClientEngagementTitle`** | Cover subtitle (client engagement headline). |
| **`FooterAttribution`** | Optional; defaults to `Prepared by {FirmDisplayName} using ArchLucid`. |
| **`LogoBlobReference`** | Optional opaque reference for storage integrations (not rendered directly; callers resolve to bytes). |

When **`whitelabel`** is null, the packet uses ArchLucid default cover copy (**Architecture review board packet**) and footer **Prepared by ArchLucid**.

Tenant isolation: logos and branding inputs must be resolved **per tenant** from private storage; never reuse another tenant's logo bytes in export payloads.

#### Report sections (what populates each)

| Section | Primary sources |
|---------|-----------------|
| **Executive summary** | Analysis report summary (`ArchitectureAnalysisReport.Summary`). |
| **System overview (architecture snapshot)** | Golden manifest services/datastores/relationships/governance/compliance tags. |
| **Evidence reviewed** | Evidence package request narrative, constraints, required capabilities. |
| **Architecture decisions** | Decision traces on the review (for example run events, rule audits). |
| **Key risks** | Governance classification from snapshot plus analysis warnings. |
| **Policy findings** | Policy constraints and required controls from snapshot governance. |
| **AI-assisted analysis** | Model-assisted warnings pending disposition. |
| **Traceability appendix** | Snapshot timestamps, manifest identifiers, optional correlation metadata. |
| **Recommended next actions** | Derived constraints and warnings as actionable lines. |

Cover metadata lines include **Review ID**, **Review (run) ID**, **Request ID**, **Architecture snapshot version**, and generation timestamp.

#### Logo requirements

Validated by **`ArchitectureReviewBoardCoverLogoValidator`**:

| Rule | Detail |
|------|--------|
| **Formats** | **PNG** or **JPEG**, detected by **magic bytes** (not file extension or advertised MIME alone). |
| **Max size** | **2 MB** decoded (`MaxLogoBytes`). |
| **Empty** | Rejected when non-null; **`null`** skips embedding. |

Unsupported formats (for example BMP, WebP, GIF) are rejected even if mislabeled as `image/png`.

#### Security review checklist (logo and branding)

- [ ] Logo bytes validated (magic-byte PNG/JPEG, size cap) before embed in DOCX/PDF streams.
- [ ] Logo retrieval uses **tenant-scoped** storage and authorization; no cross-tenant cache reuse for blob payloads used in exports.
- [ ] Blob or SAS URLs follow organizational policy (**private endpoints**, no public SMB or file shares for tenant artifacts).
- [ ] Whitelabel strings are treated as **display text** (rendering handled by OpenXML and QuestPDF); callers supply plain text fields only.
- [ ] Export operations are audited per host configuration (consulting exports emit audit events today; align architecture-review-board HTTP with the same pattern when exposed).
- [ ] Samples in **`docs/go-to-market/samples/`** are **synthetic** only; rotate if accidental real data is ever embedded.

#### Regenerating samples {#regenerating-samples}

From repository root (PowerShell example):

```powershell
$env:ARCHLUCID_WRITE_GTM_ARB_SAMPLES = "1"
dotnet test .\ArchLucid.Application.Tests\ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~ArchitectureReviewBoardMarketingSampleGeneratorTests"
```

Optional: **`ARCHLUCID_REPO_ROOT`** when the test cannot walk to a directory containing **`docs/go-to-market`**.

#### Acceptance criteria (GA task cross-check)

- [x] Tests exercise DOCX/PDF **with whitelabel plus logo** (`ArchitectureReviewBoardExportDocxStructureTests`, `ArchitectureReviewBoardExportPdfStructureTests`, pipeline integration tests).
- [x] Sample **DOCX** and **PDF** exist under **`docs/go-to-market/samples/`** for marketing links.
- [x] Logo handling security checklist documented (this page).
- [x] Export copy uses glossary-aligned terms (**architecture snapshot**, **finalize/finalized review**, **review** context) per **#27** and [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](../library/CONCEPT_VOCABULARY.md#ui-glossary-v1).

---

## Related documents

| Doc | Use |
|-----|-----|
| [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) | All Docker workflows including demo overlay |
| [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) | Technical demo seed and HTTP verification |
| [`#screenshot-capture-brief`](#screenshot-capture-brief) | Marketing/demo PNG capture brief (10 shots) |
| [`#demo-scripts`](#demo-scripts) | Five-minute / 30-minute live scripts + video storyboard |
| [#demo-workspaces](#demo-workspaces) · [DEMO_WORKSPACES.md](DEMO_WORKSPACES.md) (alias) | Hosted GA Workspace A/B pins + welcome hero |
| [`#gtm-samples`](#gtm-samples) · [`samples/README.md`](samples/README.md) (alias) | Synthetic ARB DOCX/PDF samples + export how-to |
