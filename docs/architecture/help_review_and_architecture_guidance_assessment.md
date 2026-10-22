# Help review-and-architecture guidance assessment

**Status:** Assessment only. No product code, content, routes, navigation, tests, or styling were modified while producing this file.

**Scope:** ArchLucid's help-center coverage of architecture creation vs. architecture review, centered on `/help/review-guide`, but extending to every help route, contextual-help wiring, and navigation label that participates in the same responsibility space. Includes a forward look at the (currently unimplemented) six-dimension assurance-coverage model.

**Method:** Read-only repository inspection — the help route registry and renderer (`archlucid-ui/src/lib/product-documentation-registry.ts`, `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`), the underlying markdown sources under `docs/library/`, contextual-help wiring in product components, navigation builders, the two new (untracked) architecture-assessment documents on the assurance-coverage model, and backlog history in `docs/library/TECH_BACKLOG.md`. Every claim is grounded in a cited file; where the task brief's assumptions conflict with shipped repository decisions, both are stated and the conflict is flagged for the owner rather than silently resolved.

**Reading order:** If you read only two sections, read **1. Sponsor recommendation** and **20 (§18 “Final recommendation”)**. Part-numbering below follows the 20 required deliverables from the task brief, in order.

---

## 1. Sponsor recommendation

**`/help/review-guide` has a real but currently mis-scoped job. Narrow and revise it — do not keep it unchanged, do not merge it, do not remove it, and do not convert it into a bare landing page.**

Its job, once corrected, is: *the durable field reference for what each step of the New Architecture Review wizard (`/reviews/new`) means and why, including what “review scope” currently is and will become* — nothing else. Today it over-reaches into content four other pages already own (or should own), it under-reaches on architecture creation (which it never mentions despite adjacent responsibility), and it is invisible from the help center's own browsing grid, reachable only via one wizard header link and — per a genuine repository bug — a **mislabeled global-search entry that calls it "First review guide"** (`archlucid-ui/src/lib/help/help-search-panel-catalog.ts:54-60`), which is the exact confusion the task brief hypothesized and this assessment can now prove exists in the shipped product, not just in theory.

**The four load-bearing findings that drive every other recommendation in this document:**

1. **`evidence-intake` (“Start a review”) and `review-packages` (“Review packages”) render byte-identical content** — both resolve to `docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md` (`product-documentation-registry.ts:140-152`). Neither page's title or summary describes what a visitor actually receives (four persona API/CLI recipes). This is not overlap — it is literal duplication with two different labels, and it is the single most damaging finding in this assessment because it means **two of the four pages `/help/review-guide`'s own "Related guides" section points to are not distinguishable from each other**.
2. **`evidence-trail` does not describe the evidence trail** — it renders the general concepts doc (`CONCEPTS_IN_5_MINUTES.md`, `product-documentation-registry.ts:169-174`), and the actual evidence-trail product surface (`/graph`, nav label **Evidence graph**) has zero outbound `/help` link of its own.
3. **Architecture creation (`/architectures`, `/architectures/new`) has zero outbound help links in the product today**, despite a contextual-help route mapping to `getting-started` existing in code (`page-help-topic-map.ts:17`) with no button ever mounted to use it. There is no dedicated help page for "what is an architecture draft, and how is it different from starting a review" — the exact distinction the task brief is most worried about — anywhere in the help system.
4. **The planned six-dimension "assurance coverage" model does not exist in code, tests, or any shipped UI.** It exists only in two new, untracked, read-only assessment/prompt documents (`docs/architecture/architecture_quality_policy_engine_assessment.md`, `docs/architecture/policy_pack_optimization.md`), both explicitly labeled "Status: Assessment only" / "Phases 1–7 not started." Today, "review scope" in the product is a single binary toggle — **Focused review scope** — that narrows evaluation to exactly two named standards (Security Architecture Baseline, FinOps & Cloud Cost Optimization). Any help copy describing six always-on quality dimensions, organization-required packs, platform overlays, or visible exclusions today would be **describing a feature that does not exist**, which the task brief's own terminology rules forbid.

**A fifth finding requires explicit owner adjudication before any copy is touched:** the task brief's terminology rules state *"Do not use 'architecture package' when 'review package' is intended"* and treat **review package** as the correct current noun. Repository evidence shows the opposite direction of travel: **TB-738** (`docs/library/TECH_BACKLOG.md:19198-19215`, shipped 2026-07-11) deliberately renamed the buyer-facing list noun from "Review packages" to **"Architecture packages"** everywhere in the operator shell nav/hub/home, and `docs/go-to-market/UI_GLOSSARY_V1.md:12` now defines **Architecture package** as canonical and explicitly demotes **Review package** to *"(legacy UI noun)"*. Every help document this assessment inspected (`REVIEW_GUIDE.md`, `FIRST_HOUR_OPERATOR_PATH.md`, `CONCEPTS_IN_5_MINUTES.md`, `GLOSSARY.md`, `glossary-terms.ts`) still uses **"review package"** throughout and has not been updated for TB-738. See §6 for the full terminology matrix; this document does not pick a winner and instead frames it as **Unresolved owner decision #1** at the end.

**Disposition summary** (full detail in §8–§11, §18):

| Page | Disposition |
|---|---|
| `/help/review-guide` | **Narrow responsibility; keep and revise.** Becomes the concise wizard field-reference: what each step/field means, current review-scope mechanics, explicit pointer to the onboarding tutorial for first-timers. Remove persona-recipe and package/trail deep content it does not own. |
| `/help/first-hour-operator-path` (“First review guide”) | **Keep and revise (light).** Remains the onboarding narrative/tutorial for first-time buyers. Fix its “Related guides” links (2 of 4 point into the `evidence-intake`/`review-packages` duplicate pair) once that pair is repaired. No structural change. |
| `/help/evidence-intake` (“Start a review”) | **Expand responsibility.** Rewrite so its content actually matches its title — evidence intake mechanics, upload formats, what "verify intake" means — and stop rendering the persona-recipes doc. |
| `/help/review-packages` (“Review packages”) | **Rename or merge into a corrected `evidence-intake`/reference split**, or **narrow** to genuinely be about browsing/inspecting/exporting packages (its stated summary) once it has real, non-duplicate content. See §11 for the two viable paths. |
| `/help/evidence-trail` | **Narrow responsibility.** Rewrite to actually describe the evidence trail / `/graph` surface; stop rendering the general concepts doc (which `getting-started` already renders in a custom view). |
| Architecture creation (no current help page) | **New contextual help, not a new standalone page** — see §12. Do not create `/help/create-architecture`; wire `getting-started` or a small new architecture-specific section into the existing creation surfaces instead. |
| `/help/scope` (workspace/tenant scope) | **Keep unchanged.** Correctly scoped already; the risk is only that its name ("scope") collides with "review scope" — a naming problem to fix in cross-links, not in this page's content. |

**What NOT to do:** do not write any help copy describing the six-dimension baseline, organization-required packs, platform overlays, or visible exclusions as current capability (§14). Do not delete `first-hour-operator-path` (§9). Do not remove `/help/review-guide` (§20 — Option E is rejected). Do not merge `first-hour-operator-path` into `review-guide` (§20 — Option C is rejected).

---

## 2. Current help-route inventory

Routing architecture: dynamic route `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx` resolves every `/help/{slug}` from the registry `archlucid-ui/src/lib/product-documentation-registry.ts` (57 topics). Nine slugs render a **custom React guide component** instead of their registered markdown (`getting-started`, `how-it-works`, `core-pilot`, `findings`, `governance-approval`, `alerts`, `troubleshooting`, `specialty-walkthroughs`) — for those, the registry's `sourcePaths` is *not* what the user sees, which matters when auditing "what does this page actually say" vs. "what does the registry claim it sources from."

Full inventory of the pages named in the task brief, plus the pages they structurally overlap with:

| Route | Title (rendered) | Source | Audience | In `/help` landing grid? | TOC | Related-guides section |
|---|---|---|---|---|---|---|
| `/help/review-guide` | Review guide | `REVIEW_GUIDE.md` | buyer | **No** | Yes | Yes (4 links) |
| `/help/first-hour-operator-path` | First-review guide | `FIRST_HOUR_OPERATOR_PATH.md` | buyer | Yes | Yes | Yes (5 links, 1 duplicate target) |
| `/help/evidence-intake` | Start a review | `WORKFLOW_RECIPES_BY_PERSONA.md` | operator | Yes | Yes | No (persona sections instead) |
| `/help/review-packages` | Review packages | `WORKFLOW_RECIPES_BY_PERSONA.md` **(identical to evidence-intake)** | operator | Yes | Yes | No (same as evidence-intake) |
| `/help/evidence-trail` | Evidence trail | `CONCEPTS_IN_5_MINUTES.md` | operator | Yes | Yes | Yes (“Where to go next” table) |
| `/help/findings` | Findings | Custom view (`HelpFindingsGuideView.tsx`) | — | Yes | Yes | Link to API contracts only |
| `/help/scope` | Workspace and scope guide | `WORKSPACE_SCOPE_GUIDE.md` | — | No | Yes | Yes |
| `/help/core-pilot` | Your first architecture review | Custom view (`HelpCorePilotGuideView.tsx`) | — | No | Yes | Yes |
| `/help/getting-started` | Getting started | Custom view (`HelpGettingStartedGuideView.tsx`) | — | Yes | Yes | — |
| `/help/first-pilot-path` | Complete review workflow | `COMPLETE_REVIEW_WORKFLOW.md` | — | No | Yes | Yes |
| `/help/governance-approval` | Governance approval | Custom view | — | Yes | Yes | — |
| `/help/pilot-guide` | Pilot guide | `PILOT_GUIDE.md` | — | No | — | Links to `review-guide` |
| `/help` (landing) | Help | — | — | — | No | — |

There is **no** `/help/first-review-guide` route. The task brief's assumed slug does not exist; the canonical URL for the onboarding tutorial is `/help/first-hour-operator-path`, titled **“First-review guide”** (with a hyphen, per `product-documentation-registry.ts:76`). A *separate* product route, `/onboarding`, is also labeled **“First review guide”** (no hyphen) in the sidebar (`OPERATOR_NAV_LINK_LABELS.onboarding` → `BUYER_ONBOARDING_PAGE_TITLE`, per TB-674, `docs/library/TECH_BACKLOG.md:193-194`). So there are, in the shipped product, **three different things that can reasonably be called "the first review guide"**: the `/onboarding` product checklist page, the `/help/first-hour-operator-path` help article, and (per the bug below) the help search catalog's mislabeled pointer to `/help/review-guide`. This is the single clearest piece of evidence that the "First review guide" vs. "Review guide" naming collision the task brief worried about is real, not hypothetical.

**Confirmed repository bug — search mislabeling:** `archlucid-ui/src/lib/help/help-search-panel-catalog.ts:54-60` defines a "Start here" search-panel entry:

```ts
{
  id: "first-review-guide",
  title: "First review guide",
  description: "Step-by-step: name the review, upload evidence, add context, and finalize the package.",
  keywords: ["first review", "review guide", "new review", "architecture context", "getting started"],
  action: { kind: "route", href: "/help/review-guide", helpSlug: "review-guide" },
},
```

This entry's **title says "First review guide"** but its **href points at `/help/review-guide`** (titled "Review guide" on arrival) — not at `/help/first-hour-operator-path` (the page actually titled "First-review guide"). Any user who searches "first review" from the global help search/drawer and clicks this result lands on a page whose own `<h1>` disagrees with what they clicked. This is present on every route where the drawer/search panel is mounted (global shell), independent of `/help/review-guide`'s own content quality.

### Overlap map for the pages named in the task brief

| Page A | Page B | Overlap type |
|---|---|---|
| `/help/review-guide` | `/help/first-hour-operator-path` | Both narrate a "steps to complete one review" sequence; review-guide's 7 sections and first-hour-operator-path's 4-row table describe the same lifecycle at different granularity, with materially different tone (procedural field guide vs. buyer pep-talk) |
| `/help/evidence-intake` | `/help/review-packages` | **Identical rendered content** (same source file) |
| `/help/evidence-trail` | `/help/getting-started` | Both render (or, for `getting-started`, closely mirror) `CONCEPTS_IN_5_MINUTES.md`'s "how ArchLucid works" 5-step diagram and vocabulary table |
| `/help/review-guide` §"Review findings and evidence" | `/help/findings` | Review-guide gives a 2-sentence summary of the same territory `findings` covers in full (severity, evidence, disposition) |
| `/help/review-guide` §"Confirm review scope" | `/help/scope` | **Terminology collision, not content overlap** — different concepts (policy-pack narrowing vs. tenant/workspace/project isolation) sharing the word "scope" |

---

## 3. Architecture-creation vs. architecture-review responsibility matrix

| Workflow stage | Product route(s) | Owning help content today | Gap |
|---|---|---|---|
| **1. Creating a new architecture** | `/architectures/new` → `/architectures/{id}` (single-page draft editor, no wizard) | **None.** `page-help-topic-map.ts:17` maps this prefix to `getting-started`, but no `PageContextualHelpButton` is mounted on any architecture-draft page (per repository search — zero `/help` links, zero `InAppHelpLink`, zero `ContextualHelp` calls in `components/architecture/*`) | A user saving an architecture draft has no in-context way to learn that a draft is not a review, and no help article explains the draft→review handoff explicitly |
| **2. Reviewing an existing architecture** | `/reviews/new` (wizard), `/reviews/{runId}` (detail) | `/help/review-guide` (header link), `/help/evidence-intake` (upload-zone link), `/help/core-pilot` (detail header), `ContextualHelp` tooltips | Well-wired mechanically, but the canonical overview page (`review-guide`) is not discoverable outside the wizard itself |
| **3. Preparing evidence for review** | Evidence-upload wizard steps, `WizardEvidenceUploadZone` | `/help/evidence-intake` (label matches intent) but **content is the persona-recipes doc**, not upload guidance | Title promises evidence-intake help; body delivers API/CLI recipes for four unrelated personas |
| **4. Configuring review scope** | `PilotModePolicyPackToggle` inside `AdvancedOptionsAccordion` (“Review scope (optional)”, TB-441) | `/help/review-guide` §"Confirm review scope" (2 sentences) | No dedicated reference explains that "review scope" today = a binary Security+Cost narrowing toggle, nothing else; no page distinguishes it from `/help/scope` (workspace scope) |
| **5. Executing a review** | `/reviews/new` submit → pipeline tracking | `/help/review-guide` §"Start the review"; `ArchitectureRequestWizardHelpDrawer` | Adequate |
| **6. Interpreting findings** | `/reviews/{runId}` Findings tab, `/governance/findings` | `/help/findings` (custom guide, thorough) | Well covered; `review-guide`'s own findings section is a 2-line pointer, correctly deferring to `findings` |
| **7. Making governance decisions** | `/governance`, `/governance/dashboard` | `/help/governance-approval` (custom guide, thorough) | Well covered |
| **8. Finalizing / sharing a review package** | `CommitRunButton`, review-package tab, exports | `/help/review-guide` §"Finalize the review package"; `/help/review-packages` (**but this is the duplicate content**) | The one page whose title exactly matches this stage (`review-packages`) does not contain matching content |

**Core finding:** stage 1 (creation) is under-served to the point of *absence*; stages 3, 4, and 8 are served by pages whose **content does not match their own title**; stages 5, 6, and 7 are adequately served. `/help/review-guide` currently tries to be the connective tissue across all eight stages in one page, which is why it reads as "visually serviceable but unclear content responsibility" — it is doing the job that stages 3, 4, and 8's own pages should be doing, because those pages are currently broken.

---

## 4. Duplication and contradiction findings

1. **Literal duplication:** `evidence-intake` ≡ `review-packages` (same source file, `product-documentation-registry.ts:140-152`). Not near-duplication — byte-identical rendered output.
2. **Title/content mismatch (not duplication, but equally damaging):** `evidence-trail`'s title promises trail-tracing help; its body is the general concepts primer. A user chasing "how do I trace this finding back to its source artifact" gets a vocabulary table instead.
3. **Redundant procedural tables:** `review-guide`'s 7-section walkthrough and `first-hour-operator-path`'s 4-row table both enumerate "name/upload → evidence → findings → finalize," in different words, for different declared audiences (`review-guide`: `audience: "buyer"` per registry, written like an operator field guide; `first-hour-operator-path`: also `audience: "buyer"`, written like an onboarding pep talk). Both are correctly `audience: "buyer"` in the registry, but their *voice* contradicts that shared audience label — one is terse and mechanical, the other is motivational.
4. **Contradictory link target for the same label:** the sidebar and `/onboarding` product route call themselves **"First review guide"**; the help search catalog's **"First review guide"** entry links to `/help/review-guide` (titled "Review guide"); the actual help page titled **"First-review guide"** lives at a third slug, `first-hour-operator-path`. Three surfaces, three different targets, one shared label.
5. **Terminology contradiction (structural, not a bug):** help content says "review package" everywhere; shipped nav/hub/home copy (TB-738) says "Architecture packages." Neither is wrong in isolation — they are two different, unreconciled decisions made at different times. See §6.
6. **`/help/review-guide` §"Confirm review scope" vs. `/help/scope`:** no contradiction in fact, but a naming collision that reads as a contradiction to a user who visits both pages expecting the second word ("scope") to mean the same thing twice.
7. **`review-guide`'s "Related guides" list is asymmetric with what points back to it:** `review-guide` links to `first-hour-operator-path`, `evidence-intake`, `review-packages`, `evidence-trail`. Of those, only `first-hour-operator-path` (twice) and `pilot-guide` link back to `review-guide`. `evidence-intake`, `review-packages`, and `evidence-trail` do **not** cross-link to `review-guide` at all — the relationship is one-directional, so a user who lands on any of those three via the featured `/help` grid (all three are in `HELP_CENTER_FEATURED_SLUGS`, `help-center-catalog.ts:15-30`) has no path back to `review-guide`, which itself is **not** in that featured grid.

---

## 5. Missing-content findings

1. **No help content anywhere explains "architecture draft" as a concept.** The term exists in product copy (`ArchitectureDraftWorkspace.tsx:43`: *"Long-lived architecture draft editor — save and resume without starting a review"*; `guided-intake-copy.ts:100`: *"Architecture draft only. Nothing is submitted for review until you explicitly create a review package."*) but has **no glossary entry** (`docs/library/GLOSSARY.md` has no "Architecture draft" row) and no help page defines it. This is the single most direct gap against the task brief's explicit terminology rule: *"Saving an architecture draft must never imply that a review has begun."* The product copy already enforces this correctly at the point of use; the help system has no article that teaches the same distinction for a user who wants to understand it before or outside that specific screen.
2. **No help content explains the draft → review handoff explicitly** (i.e., "Save architecture draft" vs. "Start architecture review" as two distinct, sequential actions on the same underlying architecture). `review-guide` starts *in medias res* at "Name the review," assuming the user already has evidence/context ready, and never mentions that an architecture draft can exist and be edited before a review is ever started.
3. **No dedicated reference for "review scope" as a concept independent of the wizard.** The only description is `review-guide`'s two sentences plus the toggle's own inline copy (`core-pilot-path-vocabulary.ts:19-24`). A returning user who wants to know "what exactly does Security Architecture Baseline + FinOps & Cloud Cost Optimization mean, and what happens if I turn the toggle off" has nowhere authoritative to go except `/policy-packs` itself (a product surface, not help).
4. **No help content on `/graph` (Evidence graph) as a page**, despite a `page-help-topic-map.ts:21` mapping to `evidence-trail` and a `GraphEvidenceTrailGuidanceDisclosure` component on the page — the disclosure is inline copy only, with **no link to `/help/evidence-trail`** from the page that most needs it.
5. **No visible-limitations content anywhere in the help system.** The task brief requires the future scope model to eventually disclose "visible assessment limitations." Today there is no equivalent even for the *current* narrow scope — `review-guide` says default standards apply and optionally can be limited further, but never states plainly "only these two standards evaluate your first review by default; here is what that does and does not check for."
6. **No help page or section maps the six planned quality dimensions to what exists today**, which is a defensible *absence* right now (§14) but will become a missing-content gap the moment any part of the assurance-coverage feature ships, since nothing in the current corpus is structured to be extended with a "coverage" concept — `review-guide`'s single paragraph and the toggle's two sentences are not an extensible foundation.

---

## 6. Terminology findings

### 6.1 Confirmed in-repo canonical definitions

| Term | Canonical definition found | Source |
|---|---|---|
| Review | *"A structured examination of architecture change or design intent tied to artifacts and policies."* / *"The end-to-end work unit from intake through finalized outputs for one architecture question."* | `docs/library/GLOSSARY.md:11`; `archlucid-ui/src/lib/glossary-definitions.ts` |
| Review package | *"A governed architecture review with sealed review record, evidence trail, findings, governance records, and deliverables — the unit buyers open from the reviews list."* | `archlucid-ui/src/lib/glossary-terms.ts:23-26` |
| Architecture package | *"Review package (legacy UI noun), finalized review artifact — findings, evidence trail, signed decision record, and exports for one architecture review."* | `docs/go-to-market/UI_GLOSSARY_V1.md:12` |
| Evidence trail | *"The chronological, inspectable lineage from inputs (prompts, repositories, citations) through deterministic steps to reviewer-visible outputs."* | `docs/library/GLOSSARY.md:18` |
| Architecture draft | **No glossary entry.** Product-copy-only usage. | `ArchitectureDraftWorkspace.tsx:43`, `guided-intake-copy.ts:100` |

### 6.2 The terminology conflict (RESOLVED — see “Unresolved owner decisions” §1)

The task brief's stated rule — *"Do not use 'architecture package' when 'review package' is intended"* — assumes **review package** is the settled, correct noun. Repository history shows the **opposite** settled direction:

- **TB-738** ("Architecture package vocabulary unification," **Done** 2026-07-11) explicitly renamed the sidebar/hub/home list noun from "Review packages" to **"Architecture packages"**, added drift guards in `review-terminology-surfaces.ts` specifically to *keep it that way*, and added the `UI_GLOSSARY_V1.md` row that marks "Review package" **legacy**.
- **TB-606** ("Reviews/Runs governance vocabulary," done earlier) had already removed "Review packages" from the sidebar in governance mode in favor of "Reviews"/"Runs," on the grounds that "package" primes a software-dependency reading for a technical audience.
- Neither TB-738 nor TB-606 touched the **help content** at all. Every help markdown source this assessment read (`REVIEW_GUIDE.md`, `FIRST_HOUR_OPERATOR_PATH.md`, `CONCEPTS_IN_5_MINUTES.md`, `WORKFLOW_RECIPES_BY_PERSONA.md`) still says **"review package"** throughout, unrevised since TB-738 shipped.

This assessment does **not** resolve this conflict, because it is a product-naming decision, not an information-architecture one. It is stated here as **Unresolved owner decision #1** so that no page-level copy work proceeds on either assumption until the owner picks one direction. Whatever is decided, the fix should be a single vocabulary pass across the help corpus (mirroring TB-738's own drift-guard pattern), not a page-by-page ad hoc choice.

### 6.3 Other terminology findings

- **"Scope" collision:** "review scope" (which policy standards apply to a run) and "workspace scope" / "tenant scope" (`/help/scope`, tenant/workspace/project isolation) are unrelated concepts sharing one word. `review-guide` uses "review scope"; `WORKSPACE_SCOPE_GUIDE.md` uses "workspace and scope" in its title. Recommend the help system consistently qualify every use as **"review scope"** or **"workspace scope"** — never bare "scope" — in headings and link text. `review-guide`'s own heading, "Confirm review scope," already does this correctly; the toggle label, "Review scope (optional)" (TB-441), also does. The risk is only in future prose that drops the qualifier.
- **"First review guide" vs. "First-review guide":** the sidebar/`/onboarding` product route uses no hyphen; the help registry title uses a hyphen (`product-documentation-registry.ts:76`). Minor, but it is the kind of inconsistency that makes two things that are already confusingly similar slightly more so.
- **"Review scope" is not, and must not yet be, described as "always-considered" or as covering six dimensions.** Any current-state copy that uses assurance-coverage vocabulary ahead of the feature would violate the task brief's own instruction not to claim unimplemented capability, and would contradict `architecture_quality_policy_engine_assessment.md`'s own explicit finding (§A.4, A.7) that no dimension concept, no organization-required concept, and no exclusion-persistence concept exists in code today.
- **"Architecture package" is not used anywhere in help content**, but is used pervasively in product nav/hub/home (post-TB-738). This is the practical, user-visible face of the §6.2 conflict: a buyer who reads "Architecture packages" in the sidebar and then reads "review package" throughout every help article will reasonably wonder if they are the same thing (they are, per `UI_GLOSSARY_V1.md:12`, but nothing in the help corpus says so).

---

## 7. Recommended route and navigation structure

**No route changes, no redirects, no navigation-file edits are proposed in this assessment** (per the task's explicit "do not modify... routes, navigation" instruction). This section describes the *target* structure for a future implementation pass, once approved.

Target responsibility map (slugs unchanged unless explicitly marked):

```
/help
├── getting-started            (custom view — unchanged; general concepts overview)
├── first-hour-operator-path   ("First-review guide" — onboarding tutorial, unchanged in scope)
├── review-guide               (NARROWED — wizard field reference; see §8, §15)
├── evidence-intake            (REWRITTEN — actual evidence-intake content; see §15)
├── review-packages            (REWRITTEN or MERGED — see §11, §15)
├── evidence-trail             (REWRITTEN — actual evidence-trail content; see §15)
├── findings                   (custom view — unchanged, already correct)
├── governance-approval        (custom view — unchanged, already correct)
├── scope                      (unchanged — workspace/tenant scope; correctly scoped already)
└── core-pilot                 (custom view — unchanged)
```

No new top-level `/help/*` route is recommended for architecture creation (§12 explains why). No route is recommended for removal (§20 rejects Option E).

**Featured-grid fix (content change, not a route change):** `HELP_CENTER_FEATURED_SLUGS` (`help-center-catalog.ts:15-30`) currently omits `review-guide` — the page linked from the wizard header itself — while including the two duplicate pages (`evidence-intake`, `review-packages`). Once §11's content fix lands, the featured grid should include `review-guide` and should not need both `evidence-intake` and `review-packages` as separate featured tiles if they are merged (§11, path 1) — or should feature both, now genuinely distinct, if kept separate (§11, path 2). This is a content/config change, not a navigation change, and is called out here only to flag it as an implementation-sequence item (§18).

---

## 8. Recommended responsibility for `/help/review-guide`

**Disposition: Narrow responsibility; keep and revise.**

**Exact job:** answer *"I am on, or about to open, the New Architecture Review wizard — what does each step ask for, and what does 'review scope' mean here?"* It is a **workflow guide**, not an overview (that is `getting-started`/`how-it-works`), not a tutorial (that is `first-hour-operator-path`), and not a reference manual for findings/governance/packages (those already have owners).

**What stays:**
- "Name the review" — unchanged, correctly minimal.
- "Upload architecture evidence" — condensed to a pointer plus the one or two facts specific to *this* wizard step (at least one file required; formats), deferring exhaustive format/ZIP detail to the corrected `evidence-intake`.
- "Add architecture context" — unchanged; this is genuinely wizard-step-specific and not duplicated elsewhere.
- "Confirm review scope" — expanded slightly (not narrowed) per §13, to state plainly and currently-accurately what the toggle does, using the exact TB-441 copy, and to explicitly disambiguate from workspace scope with a one-line cross-link.
- "Start the review" — unchanged.

**What is removed or shortened to a single link:**
- "Review findings and evidence" → one sentence + link to `/help/findings` (already the case in spirit, but currently duplicates 2 sentences of `findings`' own territory; trim further).
- "Finalize the architecture package" → one sentence + link to the corrected package-reference page (§11); remove the artifact/proof-packet enumeration, which belongs to that page.
- "Related guides" → keep, but fix the asymmetric linking noted in §4.7 and remove the redundant double-listing of "Architecture packages" as both a related-guide row and the finalize section's implicit topic.

**Audience:** buyer/architect preparing or mid-wizard — i.e., people who are *at* `/reviews/new`, not people browsing `/help` cold. This argues for the page staying **out of the featured "Start here" grid's top tier** (it should not compete with `getting-started` for a first-time visitor's attention) while still being **added to the grid somewhere** so it is discoverable outside the wizard (§7).

**Answers to the task brief's 20 evaluation questions, applied to `review-guide` specifically:**

| # | Question | Answer |
|---|---|---|
| 1 | Exact user question | "What does each step of the review wizard ask for, and what does review scope mean?" |
| 2 | Overview / tutorial / reference / workflow guide? | Workflow guide (field reference for an in-progress wizard) |
| 3 | Does the title communicate that? | Partially — "Review guide" is generic enough to be mistaken for the tutorial or an overview; recommend keeping the title but tightening the meta description to state "wizard field reference," not "create an architecture review" (current description overpromises breadth) |
| 4 | Distinguishable from “First review guide”? | **No, not today** — proven by the search-catalog mislabeling (§2) |
| 5 | Concepts, procedure, or both? | Procedure only; concepts belong to `getting-started`/`how-it-works` |
| 6 | Absorbs architecture-creation content? | No — and it should not; creation content belongs elsewhere (§12) |
| 7 | Duplicates “Start a review”? | Currently no (different content), but only because `evidence-intake` is broken (§4); once fixed, `review-guide`'s evidence-upload section must stay a one-line pointer to avoid re-creating the duplication |
| 8 | Duplicates “Review packages”? | Its finalize section is a compressed duplicate of what `review-packages` should say once fixed |
| 9 | Does related-guides add value? | Currently marginal (asymmetric, one link mislabeled at the catalog level); real value once §4.7 and §2's bug are fixed |
| 10 | Direct actions into ArchLucid? | Not needed beyond the existing header link — this page is reached *from* the product surface it explains, not the reverse |
| 11 | Screenshots/diagrams/lifecycle visual? | A small step-order diagram (not a screenshot) would help; not required |
| 12 | Keep right-side TOC? | Yes — page will still have ≥4 headings after trimming |
| 13 | Useful to returning users? | Not currently (too thin on scope mechanics, too padded on findings/finalize); yes after revision |
| 14 | Too long for first-timers, too shallow for experienced users? | **Yes, exactly this** — it is currently trying to be both a tutorial (too long/basic for an experienced operator) and a reference (too shallow on scope mechanics for anyone) |
| 15 | Should “First review guide” be onboarding, “Review guide” the reference? | **Yes — this is the correct model** (Option D, §20) |
| 16 | Would a landing page fit better? | No — a landing page with no owned content would just re-create the "Related guides only" problem; a thin *reference* with links is the right shape (Option D done B-style, §20) |
| 17 | What belongs in contextual wizard help instead? | Field-level formats/limits (already partly done via `WizardEvidenceUploadZone`, `WizardFieldHint`) — §12 |
| 18 | Reusable components to prevent drift? | The "what does review scope mean today" paragraph should be a single sourced fragment reused by `review-guide`, the toggle's own tooltip, and (later) any coverage-disclosure UI — not copy-pasted three times |
| 19 | Which links should be product routes vs. docs? | None currently are product routes from this page (it is reached, not reaching); no change recommended |
| 20 | Future assurance-coverage descriptions needing flags? | "Confirm review scope" is the exact section that must not describe the six-dimension model until it ships (§14) |

---

## 9. Recommended responsibility for “First review guide”

**Disposition: Keep and revise (light touch).** Applies to `/help/first-hour-operator-path`, the help article; no change recommended to the separate `/onboarding` product page or its sidebar label.

**Job, unchanged:** the onboarding tutorial — *"I am new; what is the minimum path to one complete, shareable review, and what can I safely ignore for now?"* Its "Pilot first. Operate later." framing, its explicit "What can wait" section, and its buyer-facing tone are all correct for this job and should not be touched.

**Required fixes (content-level, not structural):**
- Its "Related guides" section links to `review-packages` **twice**, under two different labels ("Architecture packages" / legacy "Review packages", and "Review artifacts and proof packet") — both currently resolve to the same duplicate content (§4.1). Once §11 is resolved, re-point these two links to whichever page(s) actually own that content.
- Confirm its four-step table's step 3 ("Finalize the architecture package") and step 4 ("Review artifacts") use **architecture package** vocabulary (Unresolved #1 RESOLVED — §6.2 / Unresolved owner decisions §1).

**Do not:** merge it into `review-guide` (Option C, rejected §20); do not lengthen it with wizard-mechanics detail that belongs in `review-guide`; do not add assurance-coverage content (§14).

---

## 10. Recommended responsibility for “Start a review”

Applies to `/help/evidence-intake`.

**Disposition: Expand responsibility (rewrite).** This is the page with the largest gap between its promise and its delivery. Its title ("Start a review"), summary (*"Start a review from a brief, diagram, document, or cloud evidence; verify intake before finalize"*), and its featured-grid presence all promise exactly the content the task brief calls "evidence-upload guidance" and "review-start guidance." Its actual body — four persona-based API/CLI recipes for architects, governance leads, procurement reviewers, and platform engineers — is legitimate content, but it is **reference/integration documentation for a different audience** (operators wiring ArchLucid into CI or governance tooling), not intake guidance for someone about to click "Start architecture review" in the UI.

**Recommended new content responsibility:** what evidence formats are accepted; what "verifying intake" means before finalize; how the quick-start vs. guided-intake vs. templates-and-imports path switcher (`ReviewsNewPathSwitcher`) differs; what the ZIP/inventory upload paths validate. This is exactly the content `WizardEvidenceUploadZone`'s footer link already promises when it says "View the start review guide."

**Where the persona-recipes content should go instead:** it is legitimate, well-structured content and should not be deleted — but it belongs under a route whose name says what it is (e.g., a "workflow recipes by persona" or "API and CLI recipes" topic), not under "Start a review." This is a **rename**, not a removal, for that content specifically (see §11 for the mechanics).

---

## 11. Recommended treatment of “Architecture packages” (slug `review-packages`) and “Evidence trail”

### Architecture packages

Two viable paths; this assessment does not pick between them because the choice depends on whether the owner wants a dedicated persona-recipes page to keep existing in the help center at all (its content is legitimate but is not help-center-shaped — it reads like engineering-adjacent integration documentation, similar in register to `cli-usage` or `api_contracts`-linked pages).

- **Path 1 (recommended if the persona-recipes content should stay in `/help`):** Keep `evidence-intake` as the rewritten intake-guidance page (§10). **Rename** the current duplicate content's slug from being shared with `evidence-intake` to its own dedicated slug (e.g., a `workflow-recipes` topic) whose title and summary accurately describe persona recipes. Rewrite `review-packages` itself to actually cover what its current summary promises — browsing, inspecting, and exporting packages in the workspace — content that does not exist anywhere in the help corpus today.
- **Path 2 (recommended if the persona-recipes content is judged out of scope for buyer/operator help):** **Convert to contextual help** or move the persona-recipes content to a developer/integration doc outside `/help` entirely (it already lives in `docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`, which could be re-scoped as an engineering/integration doc rather than a customer-facing help source), and give `review-packages` fresh, dedicated content matching its title.

Either path removes the duplication (§4.1); Path 1 preserves more existing content; Path 2 is a larger rewrite but produces a cleaner buyer/operator help corpus. **Resolved 2026-07-12: Path 2** (see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) PQ-HELP-01 / **TB-761**).

### Evidence trail

**Disposition: Narrow responsibility (rewrite).** Should describe: what the evidence trail is (the finding → artifact provenance chain), how to reach it (`/graph`, nav label "Evidence graph" — the terminology mismatch between the help slug "evidence-trail" and the product nav label "Evidence graph" should itself be reconciled as part of Unresolved owner decision #1's broader vocabulary pass), what the different graph modes show, and what "tracing a finding" looks like step by step. The general concepts content it currently renders should stay reachable (it is legitimately useful), but from `getting-started`, which already renders a closely related custom view of the same material — not duplicated a third time under a mismatched title.

---

## 12. Contextual-help vs. standalone-help recommendations

**Principle applied throughout this assessment:** if the content only makes sense at the moment a specific control is visible (a field's format limit, what a toggle does right now, what an error means), it belongs in contextual help (tooltip, `ContextualHelp`, inline disclosure, field hint) — not a standalone `/help/*` page. If the content is stable across sessions and someone would plausibly want to open it in a new tab, bookmark it, or send it to a colleague, it belongs in a standalone page.

| Content | Recommended home | Why |
|---|---|---|
| "What is an architecture draft, and how does starting a review differ from saving a draft?" | **Contextual help on `/architectures` and `/architectures/{id}`**, not a new standalone page | It is a one-time orientation fact needed exactly once, at the point of confusion; a whole page would be under-visited (mirrors why architecture creation currently has zero help links — nobody built the contextual affordance, and a standalone page would likely fare the same) |
| "What does the Focused review scope toggle do right now?" | **Contextual tooltip on the toggle itself, sourced from the same fragment `review-guide` uses** (§8, Q18) | Needs to be exactly accurate at the moment of the decision; a standalone page cannot enforce that a stale copy of this sentence doesn't drift from the toggle's real behavior |
| "What formats can I upload, and what happens during validation?" | **Both** — a short reference paragraph on the corrected `evidence-intake` page (stable, linkable) plus the existing inline `WizardFieldHint`/ZIP-validation-error contextual copy (already implemented, keep as-is) | Different audiences: pre-visit research (standalone) vs. mid-action error recovery (contextual) |
| "What does this specific finding's severity/disposition mean?" | **Contextual (already the case)** via `FindingEvidenceLinkChip`, `QuickDecisionSummary` — `/help/findings` for the general model | Correct split already exists; no change |
| Persona API/CLI recipes | **Standalone**, but re-titled/re-scoped per §11 | Genuinely reference material someone bookmarks, not a moment-of-use tooltip |
| Future assurance-coverage groupings (baseline / org-required / overlay / contextual / optional) | **Both, once built** — a standalone reference page explaining the model, plus contextual "why recommended" / "why excluded" copy inline on each `CoverageAssignment` row per the architecture assessment's own UI recommendation (`architecture_quality_policy_engine_assessment.md` §C.14) | Mirrors the existing, working pattern already used for policy packs today — do not invent a different pattern for coverage |

---

## 13. Current-state copy corrections safe before the assurance-coverage feature ships

These are content-only corrections (not implemented in this task, listed here as the safe, immediately actionable set once the owner approves any implementation pass):

1. **Fix `help-search-panel-catalog.ts:54-60`'s "First review guide" entry** to point at `/help/first-hour-operator-path`, and add (or correct) a separate, accurately-titled "Review guide" search entry pointing at `/help/review-guide`. This is the single highest-value, lowest-risk fix in this entire assessment — it directly resolves the confirmed bug in §2.
2. **De-duplicate `evidence-intake`/`review-packages`** per §11 (owner path decision required first).
3. **Rewrite `evidence-trail`** to describe the actual evidence trail (§11).
4. **Expand `review-guide`'s "Confirm review scope" section** to state, plainly and accurately for *today*: "By default, your first review is evaluated against two standards — Security Architecture Baseline and FinOps & Cloud Cost Optimization. Open **Review scope (optional)** to turn this off and use every standard enabled for your workspace instead." (This restates existing, shipped behavior — `FocusedPilotModePolicyPacks.cs:6-21`, `core-pilot-path-vocabulary.ts:19-24` — more precisely than the current two sentences, without describing anything unimplemented.)
5. **Add one sentence to `review-guide`, before "Name the review,"** clarifying that a review can start from an existing saved architecture draft or from evidence provided directly in the wizard — closing gap §5.2 without requiring a new page.
6. **Add a one-line cross-link** between `review-guide`'s "Confirm review scope" heading and `/help/scope`'s intro, each disambiguating the other ("This is about which standards evaluate your review, not your workspace's tenant/project scope — see [Workspace and scope guide] for that.").
7. **Add `review-guide` to `HELP_CENTER_FEATURED_SLUGS`** (§7) so it is reachable by browsing, not only via the wizard header link.
8. **Fix the asymmetric related-guide links** in §4.7 once the pages they point to are corrected.
9. ~~**Do not** touch the "Architecture package" vs. "review package" wording until Unresolved owner decision #1 is resolved~~ — **superseded:** use **architecture package** (see Unresolved owner decisions §1 RESOLVED).

---

## 14. Future-state copy that must wait for the assurance-coverage feature

None of the following may be written as current-state copy anywhere in the help corpus, `review-guide` included, until the corresponding code ships (per `architecture_quality_policy_engine_assessment.md`'s own gap matrix, §C.4, all rows currently "No" or "Partially"):

- Any claim that "every architecture receives a provider-neutral quality baseline" or that the six named dimensions (Security, Reliability and resilience, Cost effectiveness, Performance and scalability, Operational excellence, Sustainability and resource efficiency) are all "always considered."
- Any claim of organization-required, locked packs.
- Any claim of platform-specific overlays being "recommended" with visible rationale (today's cloud-pack auto-enable, `DefaultPolicyPackCloudBaselineApplicator`, is a real mechanism, but is not exposed as an explainable recommendation — `architecture_quality_policy_engine_assessment.md` §C.4 row 3).
- Any claim of contextual pack recommendations driven by project context.
- Any claim that exclusions are "visible, deliberate, persisted, and reflected in the final scope statement" — no exclusion-reason persistence exists (`PolicyPackAssignments` has no exclusion-reason column, per the same assessment §A.11).
- Any claim distinguishing "excluded" from "not assessed" coverage in review output — today's finding-disposition model has no `Excluded`/`NotAssessed` state (§A.17 of the same assessment).
- Any Azure/AWS/GCP "peer" framing beyond what is literally true today: content parity exists at the pack-catalog level (41 bundled packs across three clouds), but **not** at the default/UX level — `RunStarterTaskFactory.BuildPolicyRefs` still hardcodes an Azure-specific pack reference, and the "standard baseline" UI badge is Azure-only (same assessment §C.4 row 4). Help copy must not claim cloud neutrality the product does not yet deliver at the default-selection layer.

**When the feature ships (any phase), copy work should follow, not precede, the phase.** Recommended sequencing once implementation begins (mirroring `policy_pack_optimization.md`'s own phase order): copy changes for a given coverage capability land in the **same PR or the next PR** after that capability's UI ships (`/governance/policy-packs` coverage grouping, per that document's §C.14), never speculatively ahead of it. Until then, `review-guide`'s "Confirm review scope" section should say only what §13 item 4 says.

---

## 15. Proposed outline for every retained or consolidated page

*(Outlines only — not implemented. Each assumes the corresponding disposition above is approved.)*

### `/help/review-guide` (narrowed)

1. One-paragraph framing: this page explains the New Architecture Review wizard step by step; link out immediately for "if you are new to ArchLucid" (→ first-hour-operator-path) and "if you want the conceptual model first" (→ getting-started/how-it-works).
2. Name the review (unchanged).
3. Start from a draft or from evidence directly (new, closes §5.2/§13.5).
4. Upload architecture evidence (condensed; link to evidence-intake for format detail).
5. Add architecture context (unchanged).
6. Confirm review scope (expanded per §13.4; cross-linked against workspace scope per §13.6).
7. Start the review (unchanged).
8. After you start: findings, decisions, and the architecture package (one paragraph each, linking to `findings`, `governance-approval`, and the corrected package-reference page).
9. Related guides (corrected link set).

### `/help/evidence-intake` (rewritten)

1. What counts as evidence (briefs, diagrams, documents, IaC, cloud inventory ZIPs).
2. Choosing a starting path (quick start vs. guided intake vs. templates/imports — matching `ReviewsNewPathSwitcher`).
3. Upload mechanics and validation (formats, size, what a ZIP validation error means — cross-linking existing contextual copy rather than re-explaining it).
4. What "verifying intake" means before you can finalize.
5. Related guides (→ review-guide, cloud-connections, review-scope section).

### `/help/review-packages` (rewritten, Path 1) or renamed persona-recipes page (Path 2)

*If Path 1:*
1. What an architecture package contains.
2. Where to find your packages (workspace list, filters).
3. Inspecting a package (tabs: findings, evidence, policies, decisions).
4. Exporting a package (formats, audiences: sponsor, security reviewer, auditor).
5. Related guides.

*If Path 2 (persona recipes relocated):*
1. Audience note: this page is for teams integrating ArchLucid via API/CLI, not for the in-product review workflow (→ review-guide for that).
2–5. Existing four persona sections, unchanged in substance, retitled to match the new page identity.

### `/help/evidence-trail` (rewritten)

1. What the evidence trail is (finding → artifact provenance).
2. Where to see it (`/graph`, modes available).
3. Tracing one finding back to its source, step by step.
4. What is and is not shown (no raw engineering logs — preserving the existing, correct promise in today's meta description).
5. Related guides (→ findings, getting-started).

---

## 16. Proposed direct product actions and cross-links

- `/architectures` and `/architectures/{id}`: add a contextual help affordance (using the existing but unused `getting-started` mapping in `page-help-topic-map.ts:17`, or a small new architecture-specific contextual section) explaining draft vs. review — **contextual, not a new page**, per §12.
- `/graph`: add an outbound link from `GraphEvidenceTrailGuidanceDisclosure` to `/help/evidence-trail` (currently zero — §5.4).
- `WizardEvidenceUploadZone`'s "View the start review guide" link already correctly targets `evidence-intake`; no change needed once that page's content is fixed to match.
- `review-guide`'s header placement on `/reviews/new` (`InAppHelpLink`, `page.tsx:51`) is correctly a product-route-to-help link and should remain; no help-to-product action links are recommended to be added to `review-guide` itself, since its role is explanatory, not action-triggering (per §8, Q10).
- Global help search/drawer: fix the mislabeled entry (§2, §13.1) — this is the highest-priority cross-link fix in the whole assessment.

---

## 17. Accessibility and usability observations

- `review-guide`, like all markdown-backed help pages, renders through `HelpTopicMarkdownView` → `MarketingAccessibilityMarkdownFragment`, which already carries the repo's accessibility baseline (heading structure, link semantics) — no page-specific accessibility defect was found in `REVIEW_GUIDE.md`'s structure itself.
- The right-side table of contents (`HelpTopicTableOfContents.tsx`) is shown whenever a page has ≥4 headings; `review-guide` currently has 7 H2s and will still have ≥4 after the narrowing in §15, so the TOC should remain (confirms task Q12's "yes" answer for this page specifically).
- The **usability** defect, not an accessibility one, is discoverability: a page reachable only via one wizard header link plus a mislabeled search entry is a *findability* failure independent of any WCAG concern. Adding it to the featured grid (§13.7) is the correct fix, not an accessibility-pattern change.
- No screenshots exist on any inspected help page (repo-wide convention, per the "hide implementation/API/version" and IBM-Carbon-restrained-enterprise-UI rules already in force) — recommending screenshots would contradict that established convention; a small **text/diagram-based** step-order visual (per task Q11) is consistent with the convention where a screenshot would not be.

---

## 18. Implementation sequence divided into bounded changes

*(Sequencing only — none of these are executed in this task.)*

| Step | Change | Depends on | Risk |
|---|---|---|---|
| 1 | Fix `help-search-panel-catalog.ts` "first-review-guide" entry mislabeling (§13.1) | Nothing | Very low — one file, corrects a proven bug |
| 2 | ~~Owner decision on Unresolved #1 (review package vs. architecture package)~~ — **RESOLVED:** prefer **architecture package** in buyer copy | Owner | Done — terminology pass may proceed |
| 3 | ~~Owner decision on Unresolved #2 (Path 1 vs. Path 2)~~ — **Resolved 2026-07-12: Path 2** (PQ-HELP-01 / **TB-761**) | Owner | Done — engineering may implement |
| 4 | Rewrite `evidence-trail` to describe the actual evidence trail (§11, §15) | Step 2 (terminology) | Low — single page, no route change |
| 5 | Resolve `evidence-intake`/`review-packages` duplication per the chosen path (§11, §15) | Steps 2, 3 | Medium — touches two registry entries and possibly one new slug |
| 6 | Narrow and revise `review-guide` (§8, §13.4–13.6, §15) | Steps 4, 5 (so its links point somewhere correct) | Low–medium — one page, several section rewrites |
| 7 | Add `review-guide` to `HELP_CENTER_FEATURED_SLUGS` (§13.7) | Step 6 | Very low |
| 8 | Add architecture-creation contextual help (§12, §16) | Independent of 1–7 | Low — new, small, additive UI affordance |
| 9 | Add outbound help link from `/graph` (§16) | Step 4 | Very low |
| 10 | (Future, gated on feature work) Assurance-coverage copy, phase-paired with implementation per §14 | Assurance-coverage code phases 1–7 | N/A until then |

Steps 1, 7, 8, and 9 remain independently shippable; both owner decisions (#1 terminology, #2 Path 2) are now resolved, so steps 4–6 are unblocked on naming.

---

## 19. Routes or files that should not be changed

- `/help/getting-started`, `/help/how-it-works`, `/help/findings`, `/help/governance-approval`, `/help/core-pilot`, `/help/troubleshooting`, `/help/alerts`, `/help/specialty-walkthroughs` — all custom-view pages already correctly scoped; none overlap the review/creation responsibility gap this assessment addresses.
- `/help/scope` (`WORKSPACE_SCOPE_GUIDE.md`) — correctly scoped; only its cross-links from other pages need a disambiguating sentence (§13.6), not its own content.
- `/help/first-hour-operator-path` — light touch only (§9); do not restructure.
- `/onboarding` product route and its sidebar label — out of scope for this help-content assessment; any change here is a separate product-UX decision, not a help-IA one.
- `PilotModePolicyPackToggle.tsx`, `FocusedPilotModePolicyPacks.cs`, and any other **code** implementing today's review-scope toggle — this assessment only recommends *describing* current behavior more precisely in help copy (§13.4); it does not recommend behavior changes.
- The two new architecture-assessment documents (`architecture_quality_policy_engine_assessment.md`, `policy_pack_optimization.md`) — read as source material only; not in scope to edit as part of this task.
- Any `docs/library/customer-facing/*.md` file not named in §8–§15's rewrite list (e.g., `PILOT_GUIDE.md`, `COMPLETE_REVIEW_WORKFLOW.md`) — reviewed for overlap and found adequate; no change recommended.

---

## 20. Adversarial option testing and final recommendation

| | Option A — keep as complete overview | Option B — landing page | Option C — merge with First-review guide | Option D — keep First-review as onboarding, `review-guide` as reference | Option E — remove |
|---|---|---|---|---|---|
| Clarity | Low — one page cannot cleanly own 8 stages | Medium — clear routing, weak identity | Low — collapses two audiences/tones into one page | **High** — each page has one unambiguous job | Low — no canonical wizard reference remains |
| Duplication | Increases (absorbs findings/packages content) | Low | High (buyer pep-talk + operator field-guide voices collide) | **Lowest** — each page keeps only what it uniquely owns | N/A |
| First-time-user usefulness | Medium (long, but complete) | Low (routes away with little of its own value) | Medium–high (one-stop, but long and mixed-tone) | High — onboarding stays a dedicated, tuned tutorial | Low — no single next step for a wizard question |
| Returning-user usefulness | Low (buried in tutorial-style prose) | Low (nothing to return *to*) | Low (tutorial framing wastes their time) | **High** — a returning user gets a short, accurate reference | Low — must reconstruct wizard mechanics from tooltips alone |
| Maintenance burden | High (must track 8 stages) | Low (mostly links) | Medium–high (one long page, two content sources to keep in sync) | **Low** — narrow, bounded scope | Lowest (nothing to maintain) but shifts burden onto scattered tooltips |
| Linkability | Medium (long page, unstable anchors) | Medium (stable but thin) | Medium (long page) | **High** — stable, focused, anchor-friendly | None |
| Navigation complexity | Unchanged | Unchanged | Reduces route count by one | Unchanged | Reduces route count by one, but breaks existing inbound links (wizard header, search catalog, cross-links from 3+ other pages) |
| Future assurance-coverage compatibility | Poor — an already-overloaded page gains another responsibility | Good — a router can add a link to a new coverage-reference page trivially | Poor — same overload problem, compounded | **Good** — a bounded "Confirm review scope" section is exactly where phased coverage copy plugs in (§14) | Poor — no anchor point for future scope-disclosure copy |
| Implementation cost | Medium–high (rewrite + absorb) | Low | Medium (careful merge of two voices/audiences) | **Low** (trim + fix links) | Medium (must re-point every inbound link across ≥4 files) |

**Verdict: Option D, executed with Option B's structural discipline (favor short reference + links over an expanded monolith) — reject A, C, and E outright.**

- **A is rejected** because it doubles down on exactly the "unclear content responsibility" problem the task brief names, and is incompatible with the future coverage model (§14), which needs a *bounded* scope section to extend, not an already-maximal page.
- **C is rejected** because `first-hour-operator-path` and `review-guide` serve genuinely different audiences (first-time buyer narrative vs. in-wizard field reference) currently expressed in genuinely different, and correctly different, voices; merging would either flatten the onboarding tone or bloat the reference.
- **E is rejected** because `review-guide` is the only page that narrates the wizard end-to-end in the wizard's own step order, it is already linked from the wizard header itself, and removing it would strand that link with no equally-scoped replacement — every candidate replacement page (`first-hour-operator-path`, `evidence-intake`, `getting-started`) is wrong on audience, tone, or granularity for that specific inbound link.
- **B alone is insufficient** because a landing page with no owned content simply relocates the "Related guides only" problem (§4.7) one level up; **D** is the right *identity* for the page, achieved using **B's instinct** to trim and link rather than expand and absorb.

**Final recommendation for `/help/review-guide`: Narrow and revise. Keep the route, keep the title, keep the TOC, keep it out of the "Start here" tutorial tier of the featured grid but add it to the grid, and rewrite its content down to exactly the scope in §8 and §15.**

---

## Content architecture summary

With both owner decisions resolved (#1 architecture package; #2 Path 2) and the sequence in §18 executed:

- **`getting-started` / `how-it-works`** own the conceptual overview ("what is ArchLucid, how does a review work in general").
- **`first-hour-operator-path`** owns the first-time onboarding narrative ("what is the minimum path to one complete package, what can wait").
- **`review-guide`** owns the in-wizard procedural reference ("what does each step of *this* wizard ask for, what does review scope mean right now").
- **`evidence-intake`** owns evidence-upload mechanics (rewritten to match its title).
- **`review-packages`** (or its Path-2 successor) owns package browsing/inspection/export (rewritten to match its title) — with persona API/CLI recipes either living there under corrected framing (Path 1) or relocated to an integration-documentation identity outside buyer/operator help (Path 2).
- **`evidence-trail`** owns provenance/tracing (rewritten to match its title), cross-linked from `/graph` itself.
- **`findings`** and **`governance-approval`** are already correctly scoped and untouched.
- **`scope`** (workspace/tenant) is already correctly scoped and untouched, with a one-line disambiguation added where it neighbors "review scope" language.
- **Architecture creation** gains contextual, in-place help (not a new standalone page) explaining the draft/review distinction — the one genuinely missing piece of coverage identified in this assessment.
- **No copy anywhere** describes the six-dimension assurance-coverage model as current capability until the corresponding phase of `policy_pack_optimization.md` actually ships, and each phase's copy update should land paired with that phase's implementation, not ahead of it.

## Unresolved owner decisions

1. **Terminology direction (RESOLVED — 2026-07 docs sweep):** **"architecture package"** is canonical (TB-738 / `UI_GLOSSARY_V1.md`); **"review package"** is legacy. Help, GTM, and engineering docs were aligned in the Architect workspace / Finalize vocabulary pass; this assessment's earlier "help still says review package" findings are historical as-of the assessment date.
2. **Evidence-intake/review-packages duplication fix path:** ~~Path 1 vs Path 2~~ — **Resolved 2026-07-12: Path 2** (relocate persona recipes out of buyer/operator `/help` as integration/engineering documentation; rewrite both help slugs to match their titles). Logged in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *PQ-HELP-01*; unblocks **TB-761**, §11, §15, and step 5 of §18.
3. **Architecture-creation contextual help scope:** should the new draft-vs-review contextual help (§12, §16) be a small net-new component, or should it reuse/extend the existing (currently unused) `getting-started` mapping in `page-help-topic-map.ts:17`? Either is viable; this is a lower-stakes implementation-detail decision that can be made at the time step 8 (§18) is picked up, not before.
4. **Feature-flag mechanics for future assurance-coverage copy (§14):** once implementation of the coverage model begins, should help copy for each phase be gated behind the same feature flag as its UI, or shipped as a docs-only PR immediately after each phase's UI merges? Either satisfies "do not claim unimplemented capability," but the choice affects how many help-content PRs are needed per phase.

## Proposed bounded implementation prompt (first approved change only)

The lowest-risk, highest-value, fully independent first step is **§18 Step 1** — the confirmed search-catalog mislabeling. Proposed prompt for a future task, to run only after explicit approval:

> In `archlucid-ui/src/lib/help/help-search-panel-catalog.ts`, the `START_HERE_TOPICS` entry with `id: "first-review-guide"` has `title: "First review guide"` but its `action.href` points at `/help/review-guide` (a page titled "Review guide"), not at `/help/first-hour-operator-path` (the page actually titled "First-review guide"). Fix this entry's `action` to point at `/help/first-hour-operator-path` with `helpSlug: "first-hour-operator-path"`, keeping its existing `id`, `title`, `description`, and `keywords` unchanged. Then add a new, separate `START_HERE_TOPICS` entry for `/help/review-guide` itself — `id: "review-guide"`, `title: "Review guide"`, a description reflecting its actual wizard-field-reference content (do not reuse the old description), and `action: { kind: "route", href: "/help/review-guide", helpSlug: "review-guide" }`. Update or add the corresponding test in `archlucid-ui/src/lib/help/help-search-panel-catalog.test.ts` to assert both entries resolve to their correct, distinct routes. Do not touch any other topic in this file, do not change any other help route, and do not modify `/help/review-guide`'s or `/help/first-hour-operator-path`'s own content in this pass.

This prompt is scoped to one file plus its test, requires no owner decision from the two listed above, and directly resolves the single most concrete, provable defect found in this assessment.
