> **Scope:** Manual QA and pilot operators validating scenarios that automated tests cannot cover; it is not a substitute for unit, integration, or Playwright coverage.

# ArchLucid Comprehensive Manual QA Checklist

This checklist focuses on scenarios that are **impossible, brittle, or infeasible to automate** — subjective comprehension, empathy, alert fatigue, and sponsor-readiness judgments. API contracts, RBAC, and standard UI flows belong in automated tests (Vitest, integration, Playwright).

## How to use this document

| Part | Where you run it | What you need |
|------|------------------|---------------|
| **[Part A — Local development machine](#part-a--local-development-machine)** | Your laptop: `archlucid-ui` dev server (optionally local API + SQL) | No Azure subscription required for most items; static demo payloads cover API-off walks |
| **[Part B — Azure and integrated environments](#part-b--azure-and-integrated-environments)** | Staging / pilot tenant / customer Azure | Entra ID, Marketplace, webhooks, Azure OpenAI, hosted extractor, PR platforms, Teams/Slack |

**Legacy section map** (bookmarks in older docs):

| Old § | New § |
|-------|-------|
| §1 | [A.6](#a6-ux--cognitive-load-the-architect-persona) |
| §2.1–2.2 | [B.1–B.2](#b1-azure-marketplace--procurement-trial-funnel) |
| §2.3 | [A.5](#a5-day-one-sre-guide-naive-reader-test) |
| §3 | [B.3–B.5](#b3-pull-request-decoration-azure-devops--github) |
| §4 | [A.7](#a7-pathological-data--edge-case-ui-states) |
| §5 | [A.8](#a8-graceful-degradation--network-failures) |
| §6 | [A.9](#a9-accessibility--inclusive-design-beyond-automated-scans) |
| §7.1 | [B.6](#b6-intentional-misconfiguration-bad-integration-tokens) |
| §7.2 | [A.10](#a10-dead-end-and-forbidden-route-analysis) |
| §8.1–8.2 | [A.11](#a11-explainability--ai-trust-subjective) |
| §8.3 | [B.7](#b7-real-llm--agent-output-quality-manual-q7-gate) |
| §8.4 | [B.8](#b8-agent-output-scores--threshold-discipline) |
| §9 | [A.12](#a12-runbook--incident-response-validation) |
| §10 | [A.13](#a13-manual-screenshot-capture--operator-ui) |

**Agent output quality (structural / semantic scores, release bar):** See **[B.8](#b8-agent-output-scores--threshold-discipline)** and canonical detail in [`docs/library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md).

**Known cross-surface gaps (hard to automate):** Use **[Appendix — Hard-to-evaluate surfaces](#appendix--hard-to-evaluate-surfaces--known-consistency-gaps)** when walking the Claims Intake spine — executive summary, list badges, counts, and provenance/nav polish are active cleanup areas.

---

# Part A — Local development machine

Run these on your laptop without provisioning customer Azure resources. Most buyer-polish and Claims Intake showcase checks work with **`npm run dev`** and static fallbacks even when the API is stopped.

## A.0 Local prerequisites

### Start the UI

From repo root:

```powershell
cd archlucid-ui
npm ci   # first time only
npm run dev
```

Default dev URL is typically `http://localhost:3000` (see terminal output).

### Environment flags (buyer vs engineer shell)

| Variable | Typical local value | Effect |
|----------|---------------------|--------|
| `NEXT_PUBLIC_OPERATOR_EXPERIENCE` | `operator` in `.env.development` | **Unset** = buyer-default labels and softer chrome; **`operator`** = dense internal nav (engineer default locally) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` for screenshot/demo walks | Buyer-polished chrome + curated static rows when lists fail |
| `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` | `true` for UI-only demos | Same static spine without live authority |
| `NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE` | `true` only when you must hit Compare under strict demo | Compare is hidden in buyer-safe demo navigation by default |

See [`archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md`](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) and [`docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`](../library/OPERATOR_UI_EXPERIENCE_MODES.md).

### Optional: live API on localhost

For **mutations** (accept finding, real Ask threads, audit search against DB), run **ArchLucid.Api** + SQL per [`docs/engineering/BUILD.md`](../engineering/BUILD.md). That is still **local** — not the same as **Part B** (Entra, Marketplace, production AOAI).

### Claims Intake showcase spine (canonical URLs)

Use these stable tokens for a **single** walkthrough session (aligned with `src/lib/showcase-static-demo.ts`):

| Step | URL |
|------|-----|
| Executive summary | `/executive/reviews/claims-intake-modernization` |
| Review package detail | `/reviews/claims-intake-modernization` |
| Provenance | `/reviews/claims-intake-modernization/provenance` |
| Primary finding | `/reviews/claims-intake-modernization/findings/phi-minimization-risk` |
| Manifest | `/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890` or manifest link from review detail |
| Evidence trail (graph) | `/graph` (select Claims Intake review, load graph) |
| Ask | `/ask` |
| Governance workflow | `/governance` |
| Governance findings | `/governance/findings` |
| Policy pack (demo) | `/governance/policy-packs/demo-healthcare-claims-pack` |
| Approval lineage | `/governance/approval-requests/{id}/lineage` (from static approval row if shown) |
| Audit | `/audit` |
| Help | `/help` |
| Marketing walkthrough | `/showcase/claims-intake-modernization` |

**Workspace label** on scope chrome should read **Claims Intake Workspace** (sample workspace), not a raw tenant id, when buyer-safe demo chrome is active.

---

## A.1 Buyer-polished vocabulary consistency

**Goal:** Sponsors see the same words on every surface — not mixed “graph / provenance / sealed manifest” jargon.

- [ ] **Evidence trail** appears in nav and graph-adjacent copy (not “provenance graph” as the primary label).
- [ ] **Decision traceability graph** (or equivalent page title) matches graph viewer chrome; filter summary mentions evidence type / decision / risk.
- [ ] **Audit trail** is used on audit pages and cross-links (not “event log” alone).
- [ ] **Finalized signed manifest record** (or shortened **signed manifest** in tight UI) — tooltips explain hash-verified, write-locked record (see `BUYER_SEALED_MANIFEST_TOOLTIP` in `buyer-polish-copy.ts`).
- [ ] **Finding** / **PHI minimization risk** labels match governance and review detail.
- [ ] Breadcrumbs and page titles on **Executive summary** use portfolio-oriented copy (ROI metrics sr-only labels: findings resolved/discovered 30d, stale risks, waivers, SQL backup region verification).

**Justification:** Vitest can assert strings exist; only a human catches awkward synonyms that break trust on a live walkthrough.

**Source of truth:** `archlucid-ui/src/lib/buyer-surface-vocabulary.ts`, `buyer-polish-copy.ts`.

---

## A.2 Claims Intake showcase spine (end-to-end, ~25 minutes)

**Setup:** `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true` **or** API stopped (static fallback after list failure). One viewport (e.g. 1440×900).

| # | Action | Pass criteria |
|---|--------|---------------|
| 1 | Open **Help** → “Your first review package” | Five steps: executive summary → signed manifest → evidence trail → governance + audit → Ask; primary CTA matches **Open executive summary** |
| 2 | Open executive summary URL | Headline and KPI cards readable; monitored-risk narrative does not sound like a blocking failure |
| 3 | Open review detail | H1 ~ **Claims Intake Modernization Review**; sample package card mentions signed manifest, evidence trail, governance approval, audit; CTAs **Open executive summary** / **View full review package** |
| 4 | Scroll **finalize / exports** (committed story) | Downloads described as ZIP for diligence; **Executive briefing package** label if shown |
| 5 | Open manifest | Sections **Decision**, **Evidence**, **Downloads**, **Diligence**; bundle download copy = finalized review package |
| 6 | Open PHI finding | Post-approval lead mentions **residual PHI minimization risk** with monitoring; confidence explainer distinguishes **finding evaluation confidence** from product accuracy |
| 7 | Open graph, load trail | **What this proves** line traces PHI risk → policy → decision → approval → manifest → audit; ~15 linked records / 7 audit events feel coherent (static counts) |
| 8 | **Ask** — placeholder “Ask about this review package…” | Grounding line: scoped to review evidence; does not claim to replace governance records; showcase anchors mention executive summary, manifest, policy, evidence trail, audit |
| 9 | **Governance** | Page title **Governance decision record**; approval lead = ADR-style copy; footnote: production still under customer change management |
| 10 | **Governance → findings** | **Monitored risks** section; CTAs **View finding and evidence** / **View evidence trail** |
| 11 | **Audit** | Intro **Recorded timeline for this review package**; **Audit trail complete** when story complete; **Download governance evidence package** |
| 12 | **Reviews list** | Featured row **Claims Intake Modernization**; tabs **Approved** / **Approved with monitoring** / **Needs attention** make sense for demo data |
| 13 | Home `/` | Sample package subtitle/lead matches review list story; no contradictory “zero reviews” if static fallback applied |

**Justification:** This is the primary **2026 buyer-polish** pilot path; automation checks links, not whether a sponsor would sign the story.

---

## A.3 First-week route guidance

Surfaces show **bridge copy**, **primary action**, and **operate deferral** when the user has not committed a first package (see `first-week-route-guidance.ts`).

- [ ] **Home** — defers Graph/Compare/governance until first committed package; primary **Start new review**.
- [ ] **Onboarding** (if enabled in your build) — four-step path before Operate lanes.
- [ ] **Reviews list** — bridge explains one review package per row; Compare called optional.
- [ ] **Review detail (in-progress)** — anchor `#run-actions` / finalize guidance; deferral note present.
- [ ] **Review detail (committed)** — anchor `#artifacts-exports`; sidebar unlock messaging for Operate tools is encouraging, not alarming.

**Justification:** Copy regressions are easy in refactors; humans verify the “first 30 minutes” narrative still holds.

---

## A.4 Help and operator home hints

- [ ] `/help` product guide cards: **Review packages**, **Signed manifests**, evidence trail, governance, Ask — no broken links.
- [ ] **Runs page buyer help tip** (if visible on `/reviews`) — aligns with featured package wording, not internal “run id” jargon.
- [ ] **After core pilot checklist hint** (footer/sidebar when applicable) — does not contradict first-week deferral.

---

## A.5 Day One SRE guide (naive reader test)

- **Test:** Give a junior engineer `day-one-sre.md` (path in repo docs) and ask them to complete basic operational tasks without help.
- **Justification:** Documentation ambiguity is a human judgment call.

---

## A.6 UX & cognitive load (The "Architect" Persona)

### Run rationale comprehension

- **Test:** On a review with rich findings (or static Claims Intake), read the run rationale / summary end-to-end.
- **Pass:** A practicing architect could explain the outcome to a peer without opening external tools.
- **Justification:** Automation checks strings; not comprehension.

### Graph snapshot orientation

- **Test:** On a busy graph (Claims Intake or large live run), find the root cause of the PHI finding visually.
- **Pass:** Layout is navigable, not unreadable spaghetti; zoom/pan feel acceptable.
- **Justification:** Pixel/regression tests do not judge layout quality.

### Finding resolution context

- **Test:** Decide accept/reject using **only** on-screen rationale, category, and recommended actions.
- **Pass:** Enough context for a governance decision without mystery meat links.

---

## A.7 Pathological data & edge-case UI states

### Wall of text

- **Test:** Rule or finding with huge description, 500+ char title, many recommended actions — desktop and narrow widths.
- **Pass:** Usable wrapping/truncation; no broken layout.

### Deep JSON manifest

- **Test:** 15+ level nested manifest tree in UI.
- **Pass:** Tree remains navigable; indentation does not destroy layout.

### Very large graph

- **Test:** Project with very large architecture graph — scroll, zoom, pan.
- **Pass:** Subjective performance acceptable (framerate, lag).

---

## A.8 Graceful degradation & network failures

### Subway tunnel (intermittent connectivity)

- **Test:** Throttle to Slow 3G / Offline in devtools; click accept/reject or navigate quickly between review tabs.
- **Pass:** Loading states, no silent wrong state, recoverable errors.

### In-flight mutation failures

- **Test:** Simulate 500 on accept finding (proxy or devtools); try back button / dismiss modal.
- **Pass:** User never believes success when the server failed.

---

## A.9 Accessibility & inclusive design (beyond automated scans)

### Screen reader context

- **Test:** Keyboard + NVDA/VoiceOver through review findings and decision trace.
- **Pass:** Tab order and announcements identify **which** finding is in focus.

### Keyboard traps

- **Test:** Modal rationale details — Tab cycle, Escape returns focus to trigger.

### High contrast / color blindness

- **Test:** OS high contrast or Deuteranopia simulation on severity chips.
- **Pass:** Severity not **only** red/yellow/green — icons or text labels present.

---

## A.10 Dead-end and forbidden-route analysis

- **Test:** Open deleted `runId`, forbidden tenant run, or `policy-packs/undefined` (should redirect to `/governance`).
- **Pass:** Gentle recovery copy, not white screen; compare blocked in strict demo unless `NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE` set.

---

## A.11 Explainability & AI trust (subjective)

### Explainability trace “gut check”

- **Test:** Finding with ~50–60% completeness — inspect missing graph nodes / paths.
- **Pass:** Score matches perceived usefulness to an auditor.

### LLM tone (simulator or local)

- **Test:** Read 10–15 generated rationales (simulator acceptable locally).
- **Pass:** Not condescending; no obvious hallucinated components.

---

## A.12 Runbook & incident response validation

- **Test:** Read `MIGRATION_ROLLBACK.md` or `ALERT_DELIVERY_FAILURES.md` as a 3 AM on-call reader.
- **Pass:** Copy-paste friendly, calm, minimal prose.

---

## A.13 Manual screenshot capture — operator UI

Use when capturing **API-not-running** or **empty DB** evidence. Pick **one** scenario per session:

- **A — API unreachable** (block API origin or stop API process).
- **B — API up, empty DB** (no seed — distinct empty states).

**Before you start:** fixed viewport; consistent `?projectId=default` if you use it; wait for spinners; name files `01-home.png`, `02-reviews-list.png`, etc.

### Ordered walk (~15–20 min)

| Block | Routes | Capture focus |
|-------|--------|---------------|
| 10.1 Home vs reviews | `/`, `/reviews?projectId=default` | Empty vs Claims Intake row; drawer if present |
| 10.2 Review package | `/reviews/claims-intake-modernization`, `/provenance`, finding, `/inspect`, optional `/executive/reviews/...` | Same `runId` throughout |
| 10.3 Manifest / marketing | `/manifests/{id}`, `/see-it`, `/showcase/claims-intake-modernization` | Story without API |
| 10.4 Graph | `/graph` provenance + architecture loads | Canvas visible |
| 10.5 Ask | `/ask` list + one question attempt | Empty vs error |
| 10.6 Governance | `/governance`, `/findings`, `/dashboard`, policy pack, lineage | Static rows vs error |
| 10.7 Audit | `/audit` default + dated search | Zero vs sample |
| 10.8 Alerts | `/alerts` inbox + rules tab | Empty console |
| 10.9 Optional | `/compare`, `/replay`, `/admin/*`, `/settings/tenant` | Partial UI |

**Coverage definition:** At least one shot each for home, reviews, detail+finding+inspect+provenance, manifest, graph, ask, governance (workflow+findings+one deep link), audit, alerts.

**Related:** [`archlucid-ui/docs/OPERATOR_DEMO_RUNS_FALLBACK.md`](../../archlucid-ui/docs/OPERATOR_DEMO_RUNS_FALLBACK.md).

---

## A.14 Vitest sanity (after UI/nav/copy changes)

From `archlucid-ui/` (Windows: prefer threads + single worker if pool times out):

```bash
npx vitest run src/components/LayerHeader.test.tsx src/lib/authority-seam-regression.test.ts src/lib/use-nav-surface.test.ts src/components/SidebarNav.test.tsx src/components/AfterCorePilotChecklistHint.test.tsx --pool=threads --maxWorkers=1
```

Expect on the order of **28** tests passing (~1 min). This does **not** replace Part A manual walks.

---

# Part B — Azure and integrated environments

These items need **staging**, a **pilot tenant**, or **customer Azure** — Entra provisioning, Marketplace commerce, outbound webhooks, Azure OpenAI, or cross-tenant federation. Local UI-only work does not satisfy them.

## B.0 When Azure is required

| Capability | Why not local-only |
|------------|-------------------|
| Marketplace trial / SaaS subscription | Commerce webhooks and Azure portal UX |
| SCIM / Entra first login | Real directory sync and app roles |
| PR decoration (GitHub / AzDO) | Pipeline runs in customer DevOps |
| Teams / Slack alert delivery | Tenant webhook endpoints |
| Invalid/expired PAT validation | Real integration endpoints |
| **Real** Azure OpenAI agent runs | `AgentExecution:Mode` + AOAI deployment on hosted API |
| Hosted Azure extractor (Tier 2 WIF) | Customer SP + ArchLucid MI federation |
| Golden cohort release gate | Documented staging deployment — [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) |

**Local API + SQL** can substitute for **some** B items only when your team explicitly mirrors production config (uncommon for Marketplace/SCIM).

---

## B.1 Azure Marketplace & procurement (trial funnel)

- **Test:** Purchase/trial via Azure Marketplace SaaS offer; landing pages, welcome email, first 30 minutes pilot.
- **Justification:** Webhooks are automated; empathy for portal → product transition is not.

---

## B.2 SCIM provisioning and first login

- **Test:** New Entra-provisioned user with no projects — empty dashboard.
- **Pass:** Clear CTAs (create project, operator guide), not a dead end.

---

## B.3 Pull request decoration (Azure DevOps / GitHub)

- **Test:** Run manifest-delta pipeline; read PR comment in GitHub/AzDO UI.
- **Pass:** Useful signal-to-noise; formatting intact in host UI.

---

## B.4 MS Teams / Slack alert fatigue

- **Test:** Burst ~20 violations in 5 minutes; observe Teams/Slack.
- **Pass:** Digest or rollup acceptable; no immediate alert fatigue.

---

## B.5 Operator Shell CLI (against hosted or staging API)

- **Test:** Terminal `Operator Shell` manual `RuleAudit` using only `--help`.
- **Pass:** Flags intuitive; errors actionable; tables readable at 80 columns.

---

## B.6 Intentional misconfiguration (bad integration tokens)

- **Test:** Configure AzDO/GitHub integration with expired/invalid token per in-app guide.
- **Pass:** Error guides remediation (renew token, scope), not bare `401`.

---

## B.7 Real-LLM / agent output quality (manual “Q7” gate)

- **Test:** On **staging** (or non-simulator host with **real** Azure OpenAI — [`FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md)), run **create → execute → commit** with a **realistic** architecture brief.
  - Skim agent findings for plausibility vs manifest.
  - Open **agent execution trace** for at least one agent (e.g. Topology).
  - Note structural/semantic signals if exposed (UI, diagnostics, Grafana).
  - Optional: same-shaped **simulator** run to contrast usefulness.
- **Record:** date, environment URL, deployment id, one line **acceptable for pilot** / **not yet** + why.
- **Templates:** [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md), [`REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md`](REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md).
- **Release bar:** [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) §10.
- **Justification:** Scheduled jobs assert JSON; they cannot certify sponsor-safe credibility.

---

## B.8 Agent output scores — threshold discipline

Use whenever you interpret **real** Azure OpenAI runs (**B.7**) or `archlucid_agent_output_*` telemetry. Product stance: **block** on insufficient reference evidence when release policy requires it — see [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md).

### Plain-English metrics

| Metric | Range | Lay meaning |
|--------|-------|-------------|
| **Structural completeness** | 0–1 | Expected JSON fields filled |
| **Semantic score** | 0–1 | Substantive claims/findings (claims×0.4 + findings×0.6) |

**Gate outcomes:** accepted / warned / rejected — shipped defaults ~warn below **0.55**, reject below **0.35** (calibration starting points, not final pilot bar).

### Why not chase 1.0 blindly

- Real LLM variance; tight floors create false release blocks.
- Floors detect shape, not prose quality.
- Simulator distributions ≠ real AOAI — calibrate on reference deployment + realistic corpus.

### Practical calibration

After **~10–20** real-mode runs on realistic briefs: consider release-blocking floors around **0.70 / 0.70** first; tighten toward **0.80+** only when measured runs routinely clear it. Log date, deployment id, brief id, pass/fail vs your bar.

### Legitimate score improvements (not gaming)

- Prompts: every claim cites evidence; every finding has concrete recommendation.
- Briefs: named components, constraints, technologies.
- Eval corpus: realistic pilot-safe briefs.
- Model/temperature: lower temperature on reference paths.

### Manual checklist (with B.7)

- [ ] Explain structural/semantic scores to a non-engineer.
- [ ] Do not “ship anyway” on warn if policy says block.
- [ ] Log one concrete improvement when scores dip.

---

## B.9 Hosted Azure extractor (Tier 2) — optional pilot

When `HostedAzureExtractor:Enabled` and customer WIF templates are in play:

- [ ] Customer Terraform/Bicep from [`deploy/customer-templates/`](../../deploy/customer-templates/) — Reader + Cost Management Reader, federated credential to ArchLucid MI.
- [ ] `POST /v1/admin/azure-extractor/hosted/configure` persists tenant/subscription without customer secrets.
- [ ] On-demand `hosted/run` ingests ZIP through upload pipeline; audit event recorded.

**Reference:** [`docs/library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md), [`docs/runbooks/AZURE_EXTRACTOR_TIER2_CONTINUOUS.md`](../runbooks/AZURE_EXTRACTOR_TIER2_CONTINUOUS.md).

**Justification:** Trust-boundary and customer-tenant ARM access cannot be validated on UI-only localhost.

---

## Document maintenance

When adding buyer copy or showcase spine tokens, update **A.1–A.2** and canonical URL table in **A.0**. When release gates change, update **B.7–B.8** and cross-links in [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md). When a gap in the **Appendix** is fixed, remove or reword that row and add a one-line note under **Appendix changelog**.

---

# Appendix — Hard-to-evaluate surfaces & known consistency gaps

These items need **human cross-surface comparison** on the Claims Intake showcase (`claims-intake-modernization`) or equivalent pilot package. Automated tests can assert individual strings; they cannot yet certify that sponsors see one coherent story. Canonical spine counts for static demo data are **`9` findings**, **`1` monitored PHI risk**, **`12` decisions** (`SHOWCASE_STATIC_DEMO_SPINE_COUNTS` in `archlucid-ui/src/lib/showcase-static-demo.ts`).

**How to record a session:** For each row, note **Pass** / **Fail** / **Blocked**, the URLs you opened, and a screenshot or one-sentence defect if Fail.

| ID | Surfaces | Known gap | What to verify manually | Likely implementation locus |
|----|----------|-----------|-------------------------|-----------------------------|
| **E.1** | Executive summary · review detail · manifest · governance | **Executive summary data is inconsistent with the rest of the package.** Summary shows **0 findings** and **low risk** while the core package shows **9 findings** and **1 monitored PHI risk**. | Open `/executive/reviews/claims-intake-modernization`, then review detail and manifest. Counts and risk posture must match spine (9 / 1 monitored). Executive KPIs must not imply “no findings” when the package narrative cites PHI monitoring. | `ExecutiveReviewFirstViewport.tsx`, executive scorecard clients, static executive payloads vs `SHOWCASE_STATIC_DEMO_SPINE_COUNTS` |
| **E.2** | Executive summary | **“Recommended executive action: Intake experience”** (or similar) appears **mis-seeded or mis-bound** — wrong field, placeholder, or unrelated to Claims Intake outcomes. | Read the recommended-action block aloud: would a sponsor act on it? It must align with Claims Intake modernization / PHI monitoring story, not a generic template. | `ExecutiveReviewFirstViewport.tsx`, `executive-risk-review-markdown.ts` |
| **E.3** | Reviews list (`/reviews`) | **Multiple packages are plausible**, but **state combinations need cleanup.** Example: **“Pending governance approval”** must not appear alongside a **PACKAGE FINALIZED** (or equivalent) badge **without explanation**. | Scan every row: status line, phase chips, and badges must be mutually consistent. If both “pending” and “finalized” appear, inline copy must explain timing (e.g. manifest finalized, approval workflow open). | `RunsListClient.tsx`, `RunsListBuyerFeaturedCard.tsx`, `RunStatusBadge.tsx`, buyer package scope filters |
| **E.4** | Governance approval lineage | Lineage is **seeded** but still exposes **environment promotion** and **raw pipeline** concepts unsuitable for buyer polish. | Open approval lineage for the showcase approval. Labels read as governance/decision history, not CI/CD jargon, unless explicitly marked **technical appendix**. | `GovernanceApprovalLineageDetailContent.tsx`, governance static demo payloads |
| **E.5** | Executive summary · manifest · governance · audit · review detail | **UTC timestamps** shown without **buyer-local or tenant-timezone** conversion. | Spot-check 3–5 prominent dates (approval, commit, audit events). Display should use clear locale (e.g. “Jan 14, 2026, 5:05 PM EST”) or labeled UTC only when intentional. | Date formatting helpers across review/governance/audit components |
| **E.6** | Evidence trail / graph (`/graph`) | **Graph node and edge labels** may still use internal names; need **normalized buyer-friendly names** per `BUYER_SURFACE_VOCABULARY`. | Load Claims Intake graph; selected node panel and legend use “finding”, “policy basis”, “approval path” language — not raw agent or pipeline tokens. | `GraphViewer.tsx`, `graph-mapper.ts`, `graph-buyer-node-detail.ts`, `ProvenanceGraphDiagram.tsx` |
| **E.7** | Provenance route · nav · breadcrumbs | **`/reviews/{runId}/provenance`** is **raw technical/debug-shaped** data. It should be **hidden from buyer-polished primary navigation** unless opened deliberately as a **technical appendix** (operator shell or explicit link). | With buyer-default shell (no `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`): provenance not in sidebar/top nav. Deep link still works for engineers; page chrome warns or defers to “technical appendix” if exposed. | `provenance/page.tsx`, nav config / `breadcrumb-map.ts`, `layer-guidance.ts`, buyer nav visibility |
| **E.8** | Home · reviews list · executive summary · manifest · governance · audit | **Finding counts, risk posture, and residual-risk summaries** lack a **single source of truth** — numbers drift between surfaces. | Same session: write down finding count, monitored-risk count, and “approved with monitoring” wording on Home, Reviews, Executive, Manifest summary, Governance findings, Audit intro. All must match **E.1** spine or live API truth. | `showcase-static-demo.ts`, `SampleFirstReviewPackageCard.tsx`, `RunsDashboardPanel.tsx`, `ManifestDetailSummaryPanel.tsx`, `AuditBuyerHeaderMetrics.tsx` |
| **E.9** | All buyer-polished routes | **Raw identifiers** (run UUIDs, manifest ids, policy pack slugs, pipeline phase tokens) shown by default instead of **friendly display names**. | Scope chrome and tables show **Claims Intake Modernization Review** (or workspace title), not `claims-intake-modernization-run` unless user expands technical details. | `buyer-safe-review-navigation.ts`, `ScopeSwitcher.tsx`, run/manifest display mappers |
| **E.10** | Scope chrome (header) | **“Sample workspace”** badge may be **environment-driven**; confirm it is **intentional in buyer mode** (demo/pilot), not leaking into production buyer tenants by mistake. | With buyer-polished shell + demo flags: badge reads **Sample workspace** with tooltip explaining demonstration data. Without demo: confirm product intent (hide vs show for sandboxes). | `ScopeSwitcher.tsx`, `BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL`, `demo-ui-env.ts` |

### Appendix — quick cross-check (Claims Intake, ~10 minutes)

Use after **[A.2](#a2-claims-intake-showcase-spine-end-to-end-25-minutes)** or when triaging sponsor feedback:

1. **E.1 + E.8** — Record findings / monitored risk on Home → Reviews → Executive → Manifest → Governance → Audit; fail if any disagree with **9 / 1**.
2. **E.2** — Executive recommended action reads as Claims Intake, not a stray template.
3. **E.3** — No contradictory pending vs finalized badges on the same row without explanation.
4. **E.7** — Buyer nav does not advertise Provenance as a primary lane.
5. **E.5 + E.9 + E.10** — Dates, ids, and sample-workspace chrome feel deliberate for a pilot demo.

### Appendix changelog

| Date | Change |
|------|--------|
| 2026-05-27 | Initial appendix from pilot QA notes (executive inconsistency, list states, lineage jargon, provenance nav, count SSOT, identifiers, sample workspace). |
