<!-- Principal-architect critique fixes #4–#10 — paste one prompt per Composer session.
     Last updated: 2026-08-04. Origin: principal-architect critique session
     (points 4–10 of "10 things about ArchLucid that would not make sense to me").
     Points 1 and 3 already have their own prompt sets:
     proof-claim-scoping.md (#1) and dual-vocabulary-cleanup.md (#3).
     Point 2 (third-party assurance) is owner-execution GTM work (G-REAL-05,
     G-ASSURANCE-02) and is intentionally NOT in this set — see
     .cursor/rules/V1_1-assurance-backlog.mdc. -->

# Principal-architect critique fixes #4–#10 — Composer prompt set

**Run order:** independent — each point stands alone. Within a point, run A before B. Run the final verification prompt (PV) after whichever points you executed. One prompt per Composer session.

**Global constraints (apply to every prompt):**

- Working-tree safety: several target files are dirty from concurrent sessions
  (`archlucid-ui/src/lib/impact-preview-page-copy.ts`,
  `archlucid-ui/src/app/(operator)/insights/impact-preview/_sections/ImpactPreviewSimulationResultsSection.tsx`,
  `archlucid-ui/src/lib/pilot-nav-profile-alignment.ts`,
  `archlucid-ui/src/lib/empty-state-presets.ts`,
  `docs/library/customer-facing/DATA_HANDLING.md`, and others).
  Run `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing any tracked
  file; if blocked (exit 2), skip that file and list it in your summary — never overwrite.
- Claim discipline: nothing you write may cross the boundaries in
  `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md` (including the proof-scope rule) or trip
  `scripts/ci/check_buyer_claim_drift.py`. When adding buyer-visible copy, prefer wording
  already blessed in `docs/library/CONCEPT_VOCABULARY.md` and
  `docs/library/VOCABULARY_ROSETTA.md` (buyer verbs: finalize, review, sealed review record —
  never commit/run/manifest on buyer surfaces).
- Verification: focused Vitest only (`npx vitest run <files>` from `archlucid-ui/`), scoped
  dotnet compile via `.\scripts\ci\agent-compile-check.ps1 -ProjectPath <csproj>` only when
  C# changed. No full-solution builds, no dev servers. One shell command per turn.
- Do not rename API routes, OpenAPI properties, C# contract types, or DB columns. All fixes
  here are copy, UI presentation, docs, and guard tests.

---

## Point 4 — "Did a rule fire or did a language model have a feeling?"

**Critique:** findings carry severity and confidence, but nowhere can a reviewer see, plainly, whether a specific finding came from a deterministic rule engine or from an LLM. An architect signing off with their name attached needs the provenance of each finding.

**Grounding:** the data already exists. `ArchLucid.Contracts/Findings/FindingTrustLabel.cs` is an 8-value enum whose values encode exactly this: `DeterministicFallback` = rule engine, `RealModel` = live LLM with evidence, `SimulatorDerived` = deterministic simulator, plus grounding-quality values (`EvidenceBacked`, `Estimated`, `Heuristic`, `Degraded`, `MissingCitation`). The problem is presentation: 8 internal values conflate two axes (origin and grounding) and are not rendered as a plain answer.

### 4A — Two-axis provenance display (origin × grounding)

```text
ArchLucid findings carry a FindingTrustLabel (ArchLucid.Contracts/Findings/FindingTrustLabel.cs,
8 values) that conflates two questions reviewers actually ask: (1) ORIGIN — did a deterministic
rule fire, or did an LLM generate this? (2) GROUNDING — is the conclusion evidence-backed or
heuristic? Split the presentation into those two axes on operator finding surfaces.

1. Explore first: find where FindingTrustLabel (or its serialized form) reaches the UI —
   search archlucid-ui/src for "trustLabel", "TrustLabel", "DeterministicFallback",
   "RealModel", "SimulatorDerived", and look at finding row/detail components under
   archlucid-ui/src/components and the reviews/findings route sections. Also read
   ArchLucid.Contracts/Findings/FindingTrustLabel.cs for exact semantics.
2. Create archlucid-ui/src/lib/finding-provenance-display.ts: a pure module that maps each
   trust-label value to { origin: "Deterministic rule" | "AI-generated" | "Simulated" ,
   grounding: "Evidence-backed" | "Estimated" | "Ungrounded" | "Degraded" | "Not applicable" }.
   Mapping intent: DeterministicFallback → rule/Not applicable; RealModel → AI/Evidence-backed;
   EvidenceBacked → AI/Evidence-backed; Estimated → AI/Estimated; Heuristic → AI/Ungrounded;
   Degraded → AI/Degraded; SimulatorDerived → Simulated/Not applicable; MissingCitation →
   AI/Ungrounded. Use an exhaustive switch with a never-check default. Export short one-line
   reviewer-facing explanations for each origin (e.g. "A deterministic policy rule fired;
   the rationale comes from the rule definition, not a model.").
3. Render the origin as a compact badge next to severity on the finding row and finding
   detail components you located, with the grounding label as secondary text or tooltip.
   Reuse existing badge components/styles; do not invent a new design language.
4. Add a legend: extend the most relevant existing help/explainability surface (search for
   an existing findings-help or trust/confidence legend component before creating anything)
   with a short "Where findings come from" section using the same three origin words.
5. Tests: unit-test the mapping module exhaustively (every enum value), plus one render
   assertion per touched component. Run focused vitest on the new/changed files only.

Constraints: presentation-only — no C# changes, no API changes. Check working-tree safety
before each edit. If a finding surface file is dirty/blocked, skip it and report.
```

### 4B — Provenance split in review scorecard and methodology docs

```text
ArchLucid can now show per-finding provenance (origin: deterministic rule vs AI-generated vs
simulated — see archlucid-ui/src/lib/finding-provenance-display.ts from a prior session; if it
does not exist yet, stop and report). Give reviewers the aggregate answer and the written
methodology.

1. Aggregate display: on the review scorecard / run detail summary surface (explore
   archlucid-ui/src/app/(operator) reviews and architecture-scorecard sections; also
   archlucid-ui/src/components/reviews/), add one quiet line of copy summarizing the split
   for a finalized review, e.g. "12 findings — 7 from deterministic rules, 5 AI-generated
   (4 evidence-backed)". Compute from data already present in the page's response DTOs;
   if the DTO does not carry per-finding trust labels for the summary view, do NOT change
   the API — render the line only on surfaces that already have finding-level data, and
   note the gap in your summary.
2. Methodology doc: create docs/library/customer-facing/FINDING_PROVENANCE.md answering the
   architect's question directly in the first paragraph: every finding is labeled by origin;
   deterministic-rule findings carry the rule's rationale; AI-generated findings carry
   evidence references and a grounding label; simulated results are labeled and never cited
   as real-model output. Link FindingTrustLabel semantics without exposing enum names as
   buyer vocabulary. Cross-link from the contextual help registry
   (archlucid-ui/src/lib/contextual-help-registry.ts — DIRTY, check working-tree safety
   first; if blocked, list the intended registry entry in your summary instead of editing).
3. Respect claim boundaries: describe labeling and evidence links; do not claim accuracy
   rates or that AI findings are validated. Run scripts/ci/check_buyer_claim_drift.py on the
   new doc if it is covered by that guard's corpus.
4. Tests: render assertion for the new scorecard line; focused vitest only.
```

---

## Point 5 — "Impact preview isn't validated against production, so what is it?"

**Critique:** impact preview simulates changes against uploaded evidence and explicitly disclaims production validation. Without a crisp statement of what it IS, the disclaimer reads as "this is a guess."

### 5A — Canonical impact-preview scope + value statement

```text
ArchLucid's impact preview simulates policy/architecture changes against the evidence in a
finalized review, and correctly disclaims production validation. The problem: the copy leads
with the disclaimer and never states the affirmative value. Fix the framing with one canonical
statement used everywhere.

1. Inventory: read archlucid-ui/src/lib/impact-preview-page-copy.ts (DIRTY — run
   .\scripts\agent\check-working-tree-path.ps1 first; if blocked, write the canonical copy
   in a NEW module archlucid-ui/src/lib/impact-preview-scope-copy.ts and report that the
   merge into the dirty file is deferred). Also inventory every surface that renders impact
   preview copy: search archlucid-ui/src for "impact preview", "Impact preview",
   "simulation", and the components under
   archlucid-ui/src/app/(operator)/insights/impact-preview/ (note:
   ImpactPreviewSimulationResultsSection.tsx is DIRTY).
2. Write the canonical two-sentence statement as exported constants:
   (a) WHAT IT IS: a deterministic, repeatable what-if analysis that re-evaluates your
   governance policies and recorded findings against a proposed change — the same checks
   that ran in the review, so results are policy-consistent, not a fresh opinion.
   (b) WHAT IT IS NOT: it does not observe or test your production systems; treat results
   as review-time analysis, not runtime validation.
   Keep buyer vocabulary (review, finalized, findings); no "proof" language beyond what
   docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md allows.
3. Replace ad-hoc disclaimers on every non-blocked impact-preview surface with the canonical
   constants (is-statement first, is-not second — never the disclaimer alone).
4. Docs seam: update the impact-preview section of the customer-facing docs (search
   docs/library/customer-facing/ for impact preview coverage) to use the same two sentences.
5. Tests: assert the canonical constants render on each touched surface; update snapshots;
   focused vitest only. List every file skipped due to working-tree blocks.
```

---

## Point 6 — "Leveling up a character" navigation (pilot mode, unlock phases, tier gates)

**Critique:** progressive unlock hides destinations until milestones are hit. A senior evaluator wants to see the whole product surface immediately; hidden nav reads as gamification, not professionalism.

### 6A — Evaluator escape hatch: show locked destinations instead of hiding them

```text
ArchLucid's operator navigation uses progressive unlock (archlucid-ui/src/hooks/
useOperateNavUnlockPhase.ts, archlucid-ui/src/lib/sidebar-nav-link-filters.ts,
archlucid-ui/src/lib/nav-shell-visibility.ts, tests in
archlucid-ui/src/lib/usability/operate-nav-progressive-unlock.test.ts). Locked destinations
are currently hidden. Change the model from "hidden until earned" to "visible but locked,
with a plain reason" and add an explicit reveal-all affordance.

1. Explore the unlock pipeline first: how phases are computed, where links are filtered out,
   and how SidebarNav consumes them (archlucid-ui/src/components/SidebarNav.test.tsx,
   useOperatorShellNavRows.ts). Note pilot-nav-profile-alignment.ts is DIRTY — run the
   working-tree check before touching it; skip if blocked.
2. Add a "Show all destinations" toggle in the nav (persisted per user in whatever
   client-side preference mechanism the shell already uses — find it, do not invent one).
   When on, locked items render disabled with a short factual reason ("Available after your
   first finalized review") instead of disappearing. Reuse the existing gated-empty-state
   copy patterns (archlucid-ui/src/components/OperateGatedEmptyState.tsx) for reason wording.
3. Copy audit: sweep visible nav/unlock copy for progression-flavored words ("unlock",
   "level", "tier", "graduate", "earn") on buyer-visible surfaces and replace with factual
   availability language ("available after…", "requires a finalized review"). Do not change
   internal identifiers (phase names in code stay).
4. Keep the default behavior unchanged for first-run pilots (progressive disclosure is
   deliberate onboarding); the toggle is the escape hatch, defaulting off.
5. Tests: extend operate-nav-progressive-unlock.test.ts (check dirty status first) or add a
   sibling test file covering: toggle reveals locked rows, locked rows are disabled with
   reason text, default behavior unchanged. Focused vitest only.
```

---

## Point 7 — "Demo-derived ROI numbers are unusable for a CFO"

**Critique:** ROI figures tagged "Demo-derived" appear alongside buyer-provided numbers. Any sponsor-facing artifact that shows a demo-derived dollar figure as a headline invites the question "so this number is made up?"

### 7A — Demote demo-derived ROI on sponsor-facing surfaces + guard

```text
ArchLucid labels ROI figures by basis (Buyer-provided / Demo-derived / Estimate). Enforce a
presentation rule: demo-derived and estimate-basis ROI never renders as a headline KPI on
sponsor-facing artifacts — it either moves to a clearly-boxed "Illustrative (not your data)"
section or is suppressed with a note explaining how to supply buyer inputs.

1. Explore the ROI display pipeline: archlucid-ui/src/lib/executive-roi-kpi-display.ts,
   executive-roi-proof-status-strip.ts, sponsor-artifact-trust-posture.ts,
   sponsor-artifact-evidence-badge.test.ts, executive-dashboard-workspace-state.ts, and the
   executive dashboard sections under archlucid-ui/src/app/(operator)/architecture/
   executive-dashboard/_sections/. Identify (a) where basis is attached, (b) which surfaces
   are sponsor-facing (executive dashboard, sponsor artifacts/exports, scorecard), and
   (c) whether a demotion rule already partially exists in sponsor-artifact-trust-posture.ts
   — extend it rather than duplicating.
2. Implement the rule as a pure function in the most appropriate existing lib module
   (prefer extending sponsor-artifact-trust-posture.ts or executive-roi-kpi-display.ts):
   given a basis, return headline-eligible | illustrative-only | suppressed-with-cta.
   Buyer-provided → headline-eligible. Demo-derived → illustrative-only (rendered inside a
   labeled "Illustrative — based on demo data, not your environment" container, never as a
   top-line KPI). Estimate → illustrative-only with its existing estimate label. Use an
   exhaustive switch with never-check.
3. Apply on sponsor-facing surfaces found in step 1. Where a headline KPI would now be empty
   because only demo-derived data exists, render the existing empty/CTA pattern pointing at
   supplying buyer ROI inputs (reuse existing empty-state presets; note
   empty-state-presets.ts is DIRTY — working-tree check first, skip if blocked).
4. Guard: add a unit test asserting demo-derived basis can never map to headline-eligible,
   so a future copy change fails CI rather than shipping a made-up headline number.
5. Docs: one paragraph in the relevant GTM/ROI doc (search docs/go-to-market for the ROI
   methodology page) stating the presentation rule. Focused vitest only.
```

---

## Point 8 — "The documentation outweighs the product"

**Critique:** the governance apparatus (hundreds of markdown files, CI claim guards, meta-tests) is more visible than the analysis engine itself, which suggests effort went into policing claims rather than making findings good.

**Fix strategy:** you cannot delete governance, but you can (a) make the engine's actual depth legible in one place, and (b) reduce doc sprawl so the ratio reads sanely.

### 8A — Analysis-depth dossier: make the engine legible

```text
ArchLucid's analysis machinery (typed finding engines, agent runtime with quality gates,
retrieval grounding, deterministic policy packs) is real but scattered across code and dozens
of docs, so evaluators conclude the docs outweigh the product. Produce ONE authoritative
engine-depth document, written for a skeptical principal architect, from primary sources.

1. Inventory from code, not from existing docs: enumerate the deterministic finding engines
   (search the solution for finding-engine implementations — start from
   ArchLucid.Contracts/Findings/ consumers and the technology-consistency corpus under
   tests/technology-consistency-corpus/finding-engine/), the policy packs
   (docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md and their rule sources), and the agent
   runtime quality gates (ArchLucid.AgentRuntime — confidence levels, grounding traces,
   degradation codes).
2. Deliverable: docs/library/ANALYSIS_ENGINE_DEPTH.md with concrete counts and names:
   N deterministic engines (list them, one line each on what each detects), M policy-pack
   rule categories, the agent quality-gate chain in order (what gets rejected and why), and
   the provenance labeling story (FindingTrustLabel axes). Every number must be derived from
   code you actually read — cite file paths. No aspirational content; if something is
   planned-not-built, it does not appear.
3. Cross-link: add a pointer from docs/engineering/AGENTS.md (or the docs index the repo
   uses — find it) and from the differentiation packet
   (docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md) so both engineers and GTM lead with
   the engine, not the governance apparatus.
4. READ-ONLY except the new doc and the two cross-link edits. Check working-tree safety on
   the cross-linked files first.
```

### 8B — Docs consolidation audit (read-only deliverable)

```text
ArchLucid's docs/ tree has grown to the point where governance documentation visually
outweighs the product. Produce a consolidation audit — READ-ONLY, no docs deleted or merged
in this session.

1. Census: count and categorize every .md under docs/ (library, go-to-market, security,
   architecture, runbooks, engineering, assessments): canonical reference / process-governance
   / point-in-time assessment / duplicate-or-superseded candidate.
2. Overlap detection: identify clusters that state the same policy in 3+ places (vocabulary
   rules, claim boundaries, tenant isolation, shell discipline are known suspects). For each
   cluster name the proposed canonical survivor and which files would become thin pointers.
3. Deliverable: docs/library/DOCS_CONSOLIDATION_AUDIT.md with the census table, cluster list,
   a proposed merge/retire plan ordered by risk (lowest first), and an explicit "do not touch"
   list (files load-bearing for CI guards — check scripts/ci/ for docs paths referenced by
   checks before proposing any file for retirement; check_buyer_claim_drift.py and the route
   catalog script both read docs).
4. Do NOT execute any merges. The deliverable is the plan; the owner sequences execution.
```

---

## Point 9 — "Cloud-neutral review on an Azure-gravity platform"

**Critique:** the product claims cloud-neutral review while the platform, defaults, and depth of rules are Azure-first. An architect running AWS estates will ask exactly how deep the non-Azure coverage goes.

### 9A — Per-cloud coverage matrix + scoped copy

```text
ArchLucid claims cloud-neutral review. Make the claim precise: publish a per-cloud coverage
matrix derived from the actual rule/policy sources, and scope buyer copy to match it.

1. Ground truth: determine actual per-cloud analysis depth from primary sources —
   docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md, the finding-engine corpus under
   tests/technology-consistency-corpus/, ArchLucid.AgentRuntime/Prompts/
   TopologySystemPromptTemplate.cs, scripts/ci/assert_technology_consistency_corpus.py, and
   any per-cloud rule definitions you find. Classify each analysis capability per cloud
   (Azure / AWS / GCP / cloud-agnostic): full rules, partial rules, LLM-general reasoning
   only, or not covered.
2. Deliverable A: docs/library/customer-facing/CLOUD_COVERAGE_MATRIX.md — one table,
   capability rows × cloud columns, honest cell values, plus a paragraph explaining the
   architecture point that ingestion/evidence/review workflow is genuinely cloud-agnostic
   while deterministic rule depth varies by cloud and is documented here.
3. Deliverable B: scope the copy. Audit buyer-visible "cloud-neutral" phrasing
   (archlucid-ui/src/components/marketing/welcome-marketing-copy.ts,
   archlucid-ui/src/lib/core-pilot-first-review-copy.ts,
   archlucid-ui/src/lib/guided-intake-copy.test.ts contexts, and docs/go-to-market/
   POSITIONING.md). Where copy implies equal depth on every cloud, adjust to the scoped
   claim ("works across clouds; rule coverage by cloud is documented") or link the matrix.
   Working-tree check before every edit; skip and report blocked files.
4. Guard: extend archlucid-ui/src/lib/cloud-neutral-primary-copy-guard.test.ts (check dirty
   status) — or add a sibling — so the canonical scoped phrasing is asserted and bare
   unscoped "cloud-neutral" superlatives on primary marketing copy fail the test.
5. Focused vitest on changed tests; run check_buyer_claim_drift.py if the touched docs are
   in its corpus.
```

---

## Point 10 — "Database-per-tenant is the headline, but what about the shared app tier?"

**Critique:** leading the isolation story with database-per-tenant without addressing the shared application tier (authorization, token handling, cross-tenant request paths) reads as incomplete for real breach scenarios.

### 10A — Full-stack isolation narrative on buyer surfaces

```text
ArchLucid's buyer-facing isolation story leads with database-per-tenant. The defense-in-depth
layers above the database (per-request tenant resolution, authorization boundary tests, RLS
as a second net) exist but are documented for engineers, not buyers. Extend the buyer
narrative to the full stack — describing only controls that actually exist.

0. FIRST: read .cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc (agent-requestable rule)
   for the canonical layering, and the engineering sources: docs/security/MULTI_TENANT_RLS.md,
   docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md,
   docs/security/AUTHORIZATION_BOUNDARY_TEST_INVENTORY.md,
   docs/library/TENANT_DATABASE_TOPOLOGY.md.
1. Target: docs/library/customer-facing/DATA_HANDLING.md (DIRTY — run the working-tree
   check; if blocked, produce the new section as
   docs/library/customer-facing/TENANT_ISOLATION_LAYERS.md instead and note the intended
   merge). Add/replace the isolation section with a layered story, top down:
   (a) request layer — how tenant identity is resolved and enforced per request;
   (b) application layer — authorization boundary enforcement, with the fact that a named
       inventory of boundary tests exists (do not paste the inventory);
   (c) data layer — database-per-tenant as the blast-radius control, RLS classification as
       the additional net where tables are shared;
   (d) what a compromise of one layer does NOT give an attacker, per layer.
   Every sentence must trace to a control you verified in the engineering docs or code —
   no aspirational controls, and nothing that overstates versus
   docs/security/SOC2_SELF_ASSESSMENT_2026.md (self-assessed posture; no third-party
   attestation claims — see .cursor/rules/V1_1-assurance-backlog.mdc).
2. Consistency sweep: find other buyer surfaces that headline database-per-tenant alone
   (search docs/go-to-market/ and archlucid-ui/src for "database-per-tenant" /
   "per-tenant database") and add one sentence linking the layered story rather than
   duplicating it. Working-tree check per file; the help guide
   data-handling-tenant-isolation-help-guide-content.ts is DIRTY — skip if blocked.
3. Docs-only preferred; touch UI copy modules only where a one-line link/sentence suffices.
   Run check_buyer_claim_drift.py on touched docs if covered.
```

---

## PV — Verification sweep (run last, after whichever points executed)

```text
Verify the principal-architect critique fixes (#4–#10) executed in prior sessions, without
full builds.

1. git status --short + git diff --stat: list every file changed by this effort; confirm no
   dirty-at-session-start file was overwritten (compare against the blocked-file reports in
   prior session summaries if available).
2. UI: run focused vitest on every changed/new test file under archlucid-ui/src (single
   command, explicit file list). Report pass/fail per file.
3. Claim guards: run python scripts/ci/check_buyer_claim_drift.py; report result. If new
   customer-facing docs were added (FINDING_PROVENANCE.md, CLOUD_COVERAGE_MATRIX.md,
   TENANT_ISOLATION_LAYERS.md or DATA_HANDLING.md edits), confirm whether they are inside
   the guard's corpus and flag if they are not covered by any guard.
4. Leakage guards: run the internal-concept leakage tests (internal-concept-leakage-guard
   and internal-concept-leakage-vocabulary) to confirm no new buyer copy reintroduced
   banned vocabulary.
5. C#: only if any C# file changed, one scoped agent-compile-check.ps1 on that project.
6. Output: one summary table — point #, prompt, files changed, tests run, result, files
   skipped due to working-tree blocks. Stop all shells you started.
```
