> **Scope:** Product, content, and technical assessment ΓÇö ArchLucid's primary showcase scenario (Claims Intake Modernization), buyer relevance, healthcare coupling, the "Contoso" naming question, alternative scenarios, and long-term showcase portfolio strategy. Audience: owner, GTM, engineering. **No code or content was modified during this pass.**
>
> **Assessment date:** 2026-07-23
> **Method:** Repository-wide evidence review (UI routes and static demo payloads, backend seed services, policy packs, tests, docs, GTM backlog). No live production click-through and no buyer interviews were performed; unproven items are labeled explicitly.
>
> **Related:** [`showcase_claims_intake_modernization_assessment_2026_07_19.md`](showcase_claims_intake_modernization_assessment_2026_07_19.md) · [`ui_routes.md`](ui_routes.md) · [`DEMO_QUICKSTART.md#demo-preview-route-contract-and-safety`](../go-to-market/DEMO_QUICKSTART.md#demo-preview-route-contract-and-safety) · [`POSITIONING.md`](../go-to-market/POSITIONING.md) · [`BUYER_PERSONAS.md`](../go-to-market/BUYER_PERSONAS.md#ideal-customer-profile-icp) · [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) (**M-107**, **M-108**, **M-133**–**M-137**) · [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (**TB-887**–**TB-891**, **TB-978**–**TB-982**)
>
> **Owner ratification (2026-07-29):** **M-107** Option A Done; **M-133** Option D ratified — see [`DEMO_QUICKSTART.md#sample-package-funnel-id-matrix`](../go-to-market/DEMO_QUICKSTART.md#sample-package-funnel-id-matrix) (M-133 subsection; `DEMO_PREVIEW.md` alias). Does **not** authorize rename-in-place; execution remains **TB-979**–**TB-981** / **M-135**.

# Showcase scenario strategy assessment (2026-07-23)

---

## 1. Executive conclusion

**The healthcare framing is real but it is not the biggest problem. The biggest problem is that ArchLucid does not have one primary example ΓÇö it has three, with colliding labels.**

1. **Claims Intake Modernization** ΓÇö the only fully-built, buyer-polished spine (static TypeScript payload, 9 findings / 1 warning / 12 decisions, evidence traces, compare pair, signed record, governance approvals). Healthcare-heavy (PHI minimization hero finding, "Healthcare Claims Policy Pack v3.4.1").
2. **Contoso Retail Modernization** ΓÇö the backend SQL demo-seed family that actually powers the live marketing API (`/v1/marketing/showcase/contoso-*`), `/demo/preview`, and **trial onboarding** (`TRIAL_ONBOARDING_SAMPLE_RUN_ID` is the Contoso baseline GUID, not the Claims slug).
3. **Northwind Copilot RAG Platform** ΓÇö the "created package" sample (TB-742), which already demonstrates architecture *creation* and AI governance.

At assessment time `/see-it` banners "Healthcare claims sample" while its backing API (`GET /v1/demo/preview`) served **Contoso Retail** data — dual-universe risk. **Post-assessment (2026-07-29):** **M-107** Option A ships Claims-static fail-closed on welcome→`/see-it`→showcase; Contoso `/demo/preview` is secondary Product Tour only.

**Weighted recommendation (details ┬º17ΓÇô┬º19):**

- **End state:** a scenario-first generic primary ΓÇö **Enterprise Customer Intake Modernization** ΓÇö with **Healthcare Claims Intake Modernization retained as the secondary regulated-depth example** (Option D, weighted score 77/100).
- **Do not use Contoso as the buyer-facing showcase organization** (Option B scored 48/100, worst of five). Contoso is already embedded as internal seed naming; leave that alone short-term, but do not promote it into buyer-facing narrative. Note: the repo already uses **two** Microsoft fictional names (Contoso *and* Northwind) ΓÇö the Microsoft-universe association problem is broader than the Contoso question alone.
- **Do not rename or generalize the current spine in place.** ~90 UI files, 80+ tests, stable slugs/redirects, and ~15 shared UI helpers that branch on PHI/healthcare identifiers make a superficial rename the highest-contradiction-risk option.
- **Sequencing matters more than the destination.** Resolve M-107 and the `/see-it`/`/demo/preview` label collision now (hours, not weeks); extract the sample-definition coupling next; author the generic scenario as a *second* data package reusing ~70% of the claims architecture; only then flip the default. The controlled beta should proceed on the existing Claims spine ΓÇö it is the only fully proven experience.

This partially confirms and partially corrects the expected outcome ("generic primary, healthcare secondary, no Contoso"): the end state matches, but the evidence says the generic scenario is a **build**, not a rename, and it should not gate the controlled beta.

---

## 2. Current showcase inventory

### 2.1 Routes (Claims Intake spine)

| Surface | Route | Backing |
|---|---|---|
| Public showcase | `/showcase/claims-intake-modernization` | Static-first (`SHOWCASE_STATIC_FIRST_RUN_IDS`); marketing API optional |
| See it (30s) | `/see-it` | Demo preview payload; banners "Healthcare claims sample" |
| Live demo walkthrough | `/live-demo` | Showcase payload (noindex) |
| Demo preview | `/demo/preview` | API `GET /v1/demo/preview` (Contoso) or `public/demo-preview-snapshot.json` |
| Frictionless trial | `/try` | Session flag ΓåÆ `/reviews/claims-intake-modernization` |
| Get started | `/get-started` | Healthcare vertical ΓåÆ showcase; other verticals ΓåÆ `/demo/preview` |
| Quick start | `/get-started` (legacy `/quick-start` retired bookmark) | Canonical marketing first-run surface |
| Quick Scan | `/quick-scan` | Separate product; example form is claims-flavored |
| Review workspace | `/reviews/claims-intake-modernization` | `operator-static-demo.ts` fallback / demo env |
| Primary finding | `ΓÇª/findings/phi-minimization-risk` (+ `/inspect`, `/evidence-trace`) | Static |
| Signed record | `ΓÇª/signed-record` ΓåÆ `/signed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890` | Static manifest |
| Graph | `/graph?runId=claims-intake-modernization&graphNodeId=n-phi` | Static |
| Compare | `/compare` (`claims-intake-run-v1` vs `-v2`) | Static |
| Policy pack | `/governance/policy-packs/demo-healthcare-claims-pack` | Dedicated component `HealthcareClaimsPolicyPackDetail.tsx` |
| Aliases | `claims-intake-modernization-run`, `claims-intake-sample-workspace`, `run-claims-intake-demo` | `demo-run-canonical.ts` + `next.config.ts` redirects |

### 2.2 Content sources

| Source | Role |
|---|---|
| `archlucid-ui/src/lib/showcase-static-demo.ts` | Canonical marketing payload, IDs, spine counts, decisions, provenance |
| `archlucid-ui/src/lib/operator/operator-static-demo.ts` | Operator offline spine (runs, compare, audit, approvals, graph) ΓÇö densest healthcare-term file (~100+ hits) |
| `archlucid-ui/src/lib/showcase-created-static-demo.ts` | Northwind Copilot RAG created-package showcase |
| `archlucid-ui/public/demo-preview-snapshot.json` | Offline `/demo/preview` fallback (mentions "healthcare claims intake modernization"; different UUIDs from the spine) |
| `ArchLucid.Application/Bootstrap/DemoSeedService.cs` | SQL seed ΓÇö **Contoso Retail + Northwind tour + Alpine/Meridian regulated + Northwind created**; does **not** create the Claims slug |
| `ArchLucid.Application/Tenancy/TrialTenantBootstrapService.cs` | Trial signup copies the Contoso family per tenant |
| `ArchLucid.Api/Controllers/Marketing/MarketingShowcaseController.cs` | Resolves Contoso slugs/GUIDs only ΓÇö not `claims-intake-modernization` |

### 2.3 Assembly model (dependency map)

```text
Marketing funnel
  /welcome ΓöÇΓöÇ See it ΓöÇΓöÇΓû║ /see-it ΓöÇΓöÇΓû║ demo-preview payload (Contoso API | bundled JSON) ΓåÉ labeled "Healthcare claims"
          Γö£ΓöÇΓöÇ Demo preview ΓöÇΓöÇΓû║ /demo/preview (same Contoso/JSON path, titled "Claims Intake Modernization")
          Γö£ΓöÇΓöÇ /try ΓöÇΓöÇΓû║ frictionless session ΓöÇΓöÇΓû║ /reviews/claims-intake-modernization (static operator spine)
          ΓööΓöÇΓöÇ /get-started ΓöÇΓöÇΓû║ /showcase/claims-intake-modernization (static TS payload)

Public showcase (static-first)
  /showcase/claims-intake-modernization ΓùäΓöÇΓöÇ showcase-static-demo.ts  (no SQL, no AI, shared across visitors)
      ΓööΓöÇΓöÇ QuickNav ΓöÇΓöÇΓû║ operator deep links (review / finding / signed record / graph / compare)
                        ΓùäΓöÇΓöÇ operator-static-demo.ts (offline fallback)

Backend SQL universe (separate)
  DemoSeedService ΓöÇΓöÇΓû║ Contoso baseline/hardened (IsPublicShowcase, migration 110)
                 Γö£ΓöÇΓöÇΓû║ Northwind Product Tour (Workspace A)
                 Γö£ΓöÇΓöÇΓû║ Alpine/Meridian regulated AI-governance scenario (Workspace B)
                 ΓööΓöÇΓöÇΓû║ Northwind Copilot RAG created sample
  TrialTenantBootstrapService ΓöÇΓöÇΓû║ per-tenant copy of the Contoso family
  TRIAL_ONBOARDING_SAMPLE_RUN_ID = 6e8c4a10-ΓÇªc501 (Contoso baseline GUID)
```

**Classification (per the assessment questions):** the Claims Intake showcase is a **single coherent sample**, **hard-coded** in UI TypeScript, **shared across visitors**, **not seeded during deployment**, **not copied per user**, **not dependent on live AI** (Simulator mode, zero LLM cost ΓÇö Proven), and **not dependent on healthcare policy-pack runtime config** (the "Healthcare Claims Policy Pack v3.4.1" is a UI narrative label; no matching C#/SQL pack exists for `demo-healthcare-claims-pack`). The *trial* experience, by contrast, is Contoso and SQL-seeded. Azure dependence is presentational (the export topology names Azure API Management, Service Bus, Cosmos DB), consistent with the deliberate Azure-primary posture (ADR 0020).

---

## 3. Buyer-relevance assessment

### 3.1 30-second comprehension test (by persona, from repository copy)

| Persona | Can they get it in 30s? | Why |
|---|---|---|
| Enterprise/principal architect (regulated) | **Yes** | Intake boundary, PHI minimization, idempotency, retention ΓÇö recognizable and credible |
| CTO/CIO (regulated) | **Mostly** | Executive summary + illustrative savings ($94,360) work; healthcare vocabulary is a mild translation tax |
| Engineering leader (tech company) | **Partial** | Findings like OCR bypass, back-pressure, idempotency translate; "claims/adjudication/PHI" does not |
| Financial-services buyer | **Partial** | Regulated posture resonates; must self-translate PHIΓåÆPII, claimsΓåÆapplications |
| Government buyer | **Partial** | Governance/evidence/audit resonates; healthcare wrapper distracts |
| Manufacturing / retail buyer | **Weak** | Little vocabulary overlap; likely reads "not for us" |
| Healthcare buyer | **Strong** | Deep, credible vertical wedge |

The prior assessment reached the same verdict: "Cross-industry clarity: **Weak** ΓÇö healthcare/PHI/HIPAA heavy; Regulated-enterprise value: **Strong**" (┬º19, 2026-07-19). Confidence: **Strong evidence** for copy analysis; **Not determined** for actual buyer behavior (no telemetry exists yet ΓÇö see ┬º15).

### 3.2 Unintentional signals

| Signal | Present? | Evidence |
|---|---|---|
| Healthcare-only product | **Partly** | `/see-it` always banners "Healthcare claims sample"; the only fully-backed spine is healthcare; CTO demo's only backed story is `healthcare` (fintech/retail/public-sector are talk-track labels without backing) |
| Claims-processing product | **Mild** | Scenario title + adjudication vocabulary; countered by "not an EHR, claims system" in `buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` (#healthcare-vertical-positioning) |
| Azure-first product | **Yes ΓÇö deliberate** | ADR 0020 declares Azure primary/permanent; ICP requires Azure-primary buyers; CTAs say "Azure reference architecture" (TB-778). This is honest positioning, not accidental bias |
| Compliance-only / review-only product | **Partly** | The spine is a completed *review*; creation exists (Northwind created sample, TB-742) but is secondary in the funnel (prior assessment ┬º14: creation "underrepresented") |
| Big-regulated-enterprise-only | **Mild** | 9 findings / 12 decisions density "may overwhelm first-time visitors" (prior assessment ┬º19) |

**Is the specificity credibility or translation tax?** Both, split by persona: for the regulated ICP (which explicitly includes healthcare ΓÇö `BUYER_PERSONAS.md` (ICP) §2 lists "financial services, technology, healthcare"), the depth is a credibility asset. For the other two-thirds of the ICP it is a translation tax with no measured conversion evidence either way. Do not discard the depth; add a lower-tax default.

---

## 4. Healthcare-coupling assessment

### 4.1 Classification summary

| Layer | Coupling | Examples |
|---|---|---|
| **Pure presentation text** | Very heavy (~90+ UI files) | `buyer-polish-copy.ts` ("Claims Intake Workspace", "Healthcare Claims Policy Pack v3.4.1"), live-demo/showcase copy, `ask-static-demo-messages.ts` |
| **Sample data** | Heavy | `showcase-static-demo.ts`, `operator-static-demo.ts`, `demo-preview-snapshot.json`, e2e fixtures, eval corpus (`corpus-healthcare-hipaa-phi.findings.json`) |
| **Policy configuration** | Medium ΓÇö mostly a *feature*, not showcase coupling | Bundled `hipaa-architecture.json` pack (real vertical content, keep regardless); UI-only `demo-healthcare-claims-pack` narrative |
| **Business rules / backend behavior** | **Light** | Core review pipeline has no healthcare branching. Only: `TrialVerticalWelcomeRequestFactory` (Healthcare vertical ΓåÆ FHIR/PHI welcome brief), `UniversalIntakeQuestions` PHI example string, `AiUsageControlsOptions.PublicDemoTenantSlugs` includes `claims-intake-showcase` |
| **Route/persistent identifiers** | **Very high** | Slug + 3 aliases, `phi-minimization-risk`, `demo-healthcare-claims-pack`, manifest UUID, compare pair, `next.config.ts` redirects, sitemap |
| **Test fixtures** | Very high | 80+ test/e2e files lock the run id, "PHI Minimization Risk", pack label, spine counts 9/1/12; C# golden `ExecutiveReviewPacketDemoFixture` |
| **Analytics identifiers** | **Low** | No claims/PHI event names; route normalizer strips the slug; only the AI-budget tenant slug |
| **Documentation** | Heavy | 80–100+ docs; dedicated: `buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` (vertical positioning + demo proof shape), architect-evaluation packets, walkthroughs, `MANUAL_QA_CHECKLIST.md` |
| **Shared application assumptions** | **The expensive layer** | See ┬º4.2 |

### 4.2 Healthcare concepts inside *generic* components (the expensive couplings)

Fifteen shared helpers/components branch on healthcare identifiers rather than reading scenario data. These ΓÇö not the copy volume ΓÇö determine the cost of every strategy below:

1. `finding-display-from-inspect.ts` ΓÇö `isPhiMinimizationFindingId` (matches any id/category containing `"phi"`) + hard-coded PHI narrative fallbacks
2. `provenance-graph-presentation.ts` ΓÇö relabels finding nodes matching phi+minimization
3. `graph-mapper.ts` ΓÇö buyer-trail layout *centers the PHI hero node*
4. `graph-buyer-node-detail.ts` ΓÇö hard-coded PHI panel copy
5. `policy-pack-detail-resolver.ts` ΓÇö id substring `healthcare-claims` ΓåÆ dedicated detail kind
6. `PolicyPackDetailClient.tsx` ΓÇö mounts `HealthcareClaimsPolicyPackDetail`
7. `policy-pack-buyer-label.ts` ΓÇö special-cases `healthcare-claims-v3`
8. `demo-run-canonical.ts` / `breadcrumb-map.ts` / buyer-polished branches ΓÇö spine-slug special cases
9. `QuickDecisionSummary.tsx` ΓÇö hard-coded "monitored PHI minimization risk" sentence
10. `FindingInspectWhyMattersSection.tsx` / `ManifestDetailPageView.tsx` ΓÇö hard-coded PHI display lines
11. Alerts UX placeholders ("Production, PHI, Security"; `demo-alert-phi-intake`)
12. `specialty-review-templates.ts` ΓÇö first-class `healthcare-claims` specialty
13. `TrialVerticalWelcomeRequestFactory` ΓÇö vertical-keyed healthcare welcome brief
14. `AiUsageControlsOptions` ΓÇö `claims-intake-showcase` tenant slug
15. `UniversalIntakeQuestions` ΓÇö PHI as example sensitivity class

**Not a collision risk:** JWT/auth "claims" (`ArchLucidRoleClaimsTransformation`, `ClaimTypes`, token diagnostics) and marketing "buyer claims" lint tooling are separate vocabularies; any rename work must exclude them.

### 4.3 Effort estimates by strategy

| Strategy | Effort | Assessment |
|---|---|---|
| **A. Rename only** (e.g., "Contoso Intake") | 1ΓÇô2 weeks | **Worst option.** Slugs, redirects, sitemap, 80+ tests, docs, QA checklist all churn ΓÇö while PHI findings, HIPAA pack label, and adjudication copy remain, producing a generic name over visibly healthcare content. High contradiction risk (Proven coupling, Likely contradiction outcome) |
| **B. Generalize in place** | 4ΓÇô6 weeks | Re-author the finding narrative (PHI minimization is the hero finding ΓÇö it has no direct generic equivalent with the same punch), rewrite decision synopses, update all tests/docs. Destroys the healthcare vertical wedge that GTM docs deliberately built |
| **C. Clone into second scenario** | 3ΓÇô5 weeks *after* decoupling (┬º13); 6ΓÇô8 weeks without | ~70% of the architecture and 7 of 9 finding themes are reusable (┬º14). Requires ┬º4.2 helpers to become data-driven first, or the clone inherits PHI branches |
| **D. Replace entirely** | 6ΓÇô9 weeks | Everything in C plus deletion churn across redirects, SEO paths, docs, GTM packets ΓÇö and loses the only proven spine mid-beta |
| **E. Several selectable scenarios** | C + 1ΓÇô2 weeks per additional scenario + ongoing per-release cost (┬º16) | Only sane after the data-package refactor (┬º13) |

Confidence on effort: **Likely** (derived from file counts and coupling inventory; no timed spike performed).

---

## 5. Contoso-name assessment

**Material repository fact: Contoso is not a hypothetical ΓÇö it is already ArchLucid's live-demo and trial universe.** `ContosoRetailDemoIdentifiers`, `contoso-baseline`/`contoso-hardened` marketing slugs, migration 110 `IsPublicShowcase` flags, trial welcome run `request-contoso-trial-welcome`, ROI worked examples, and a "Contoso Clinical" starter proof pack all exist today. Separately, **Northwind** (also a Microsoft fictional name) brands the product tour and the created RAG sample.

| Criterion | Assessment |
|---|---|
| Microsoft association | **Strong and unavoidable.** Contoso is Microsoft documentation's canonical fictional company. Combined with the honest Azure-native positioning (`POSITIONING.md`), promoting Contoso to the buyer-facing primary would compound "Microsoft extension" perception on the one axis where ArchLucid already leans Microsoft |
| Azure bias reinforcement | Yes ΓÇö and unlike the platform choice, this one is gratuitous (a name adds no capability) |
| Familiarity | High among enterprise tech buyers ΓÇö but familiarity *as a Microsoft artifact*, which cuts against independent product identity |
| Originality / memorability | Low. Signals "sample project," not "product with a point of view" |
| Searchability | Poor ΓÇö swamped by Microsoft docs |
| Trademark | Contoso is Microsoft's fictional brand; using it in ArchLucid's own commercial marketing (beyond incidental demo data) is at minimum brand-diluting. **Uncertain** on formal risk ΓÇö not legally assessed here |

**Recommendation:** **Do not use Contoso for buyer-facing showcase naming** (final decisions, ┬º19 Q3). Keep the existing backend Contoso seed identifiers short-term (they are GUID-keyed internals; ripping them out is churn without buyer value), but treat buyer-visible Contoso labels on `/demo/preview` and ROI examples as cleanup within the M-107 alignment. Flag Northwind for the same eventual treatment.

**Scenario-first vs organization-first:** the repository's own copy audit already converged on activity/scenario terms ("sample review," "Claims Intake Modernization Review"). Buyers evaluate scenarios, not fictional org charts. **The scenario name should dominate**; a fictional organization is optional flavor in narrative copy ("ΓÇªfor Northstar Group") and should never appear in routes, slugs, or IDs ΓÇö that is precisely the coupling this assessment found expensive. Of the candidate names: Meridian is **already used in-repo** (Alpine/Meridian regulated scenario ΓÇö reuse would conflate two samples); Northstar/HarborPoint/Summit/Apex are unclaimed in-repo but need a trademark screen (owner task, **Not determined** here).

---

## 6. Alternative-scenario comparison

**Weights** (sum 100): immediate comprehensibility 10, cross-industry relevance 10, architectural richness 8, findings 8, evidence 7, governance 7, remediation 4, creation 5, AI governance 5, cloud neutrality 3 (*deliberately low ΓÇö ADR 0020 makes Azure-primary a fixed constraint, not a variable*), regulated credibility 8, differentiation 6, marketing clarity 7, implementation effort 6 (higher = cheaper), maintenance 4 (higher = cheaper), staleness risk 2 (higher = lower risk).

| Criterion (wt) | A Claims | B Ent. Intake | C Onboarding | D AI Assistant | E Order/Fulfil. | F Reg. Case Mgmt | G In-repo AI-gov* |
|---|---|---|---|---|---|---|---|
| Comprehensibility (10) | 55 | 75 | 80 | 70 | 85 | 60 | 65 |
| Cross-industry (10) | 40 | 90 | 75 | 85 | 60 | 45 | 80 |
| Arch. richness (8) | 85 | 85 | 75 | 80 | 80 | 75 | 75 |
| Findings (8) | 90 | 85 | 75 | 80 | 70 | 75 | 80 |
| Evidence (7) | 90 | 80 | 70 | 75 | 65 | 80 | 75 |
| Governance (7) | 90 | 80 | 75 | 85 | 60 | 90 | 90 |
| Remediation (4) | 80 | 80 | 75 | 75 | 70 | 75 | 75 |
| Creation (5) | 40 | 70 | 70 | 75 | 70 | 65 | 85 |
| AI governance (5) | 45 | 65 | 60 | 95 | 40 | 55 | 95 |
| Cloud neutrality (3) | 40 | 60 | 60 | 55 | 60 | 60 | 45 |
| Regulated credibility (8) | 95 | 75 | 80 | 70 | 45 | 90 | 85 |
| Differentiation (6) | 70 | 65 | 55 | 75 | 50 | 65 | 80 |
| Marketing clarity (7) | 55 | 75 | 75 | 80 | 75 | 55 | 70 |
| Impl. effort (6) | 100 | 55 | 40 | 60 | 30 | 35 | 70 |
| Maintenance (4) | 70 | 65 | 55 | 55 | 55 | 55 | 60 |
| Staleness (2) | 60 | 65 | 55 | 45 | 60 | 60 | 45 |
| **Weighted total** | **70** | **75** | **70** | **75** | **62** | **66** | **76** |

\* Scenario G ("discovered from repository evidence") = the Alpine/Meridian regulated AI-governance scenario + Northwind Copilot RAG created sample ΓÇö i.e., the repo has *already partially built* the Enterprise AI Knowledge Assistant story, which is why G and D score high on effort/creation.

**Reading:** no scenario dominates. B wins on breadth, A on shipped depth and zero build cost, D/G on AI-governance relevance and partial existing assets. C (onboarding/KYC) is a crowded vendor category with weaker differentiation. E and F are the weakest primaries. This near-tie is itself evidence for a *sequenced portfolio* rather than a single bet.

---

## 7. One example versus portfolio (Options 1ΓÇô6)

| Option | Verdict | Key evidence |
|---|---|---|
| **1. Healthcare only** | Viable for controlled beta; ceiling for public promotion | Only fully-backed spine; prior assessment already flagged cross-industry weakness |
| **2. Replace healthcare** | Rejected | Destroys the regulated wedge GTM deliberately built (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`, healthcare proof shapes, HIPAA pack); loses the only proven experience mid-beta |
| **3. Generalize in place** | Rejected | PHI-minimization hero finding and healthcare pack are load-bearing narrative; generalizing dilutes without gaining a second example |
| **4. Generic primary + healthcare secondary** | **Recommended end state** | Reuses ~70% of architecture/findings; keeps vertical depth; matches multi-vertical ICP |
| **5. Three examples** | Right V-next, wrong launch scope | Third scenario (AI assistant) already ~exists as Northwind created sample + Workspace B; formalize later rather than author from scratch |
| **6. Industry skins** | **Rejected** | The spine's value is 9 findings + 12 decisions + evidence traces that *cohere as one story*. Re-labeling cannot make "PHI minimization at the intake boundary" credibly become a manufacturing finding; skins would produce exactly the shallow/contradictory examples the prompt warns about. The ┬º4.2 helpers show even one scenario leaked into shared code ΓÇö six skins would multiply that |

Per-option burden: Option 4 adds one static data package + test suite (┬º16 estimates); Option 5 adds a second increment at lower marginal cost *if* ┬º13's data-package refactor lands first; Option 6 has the worst content-drift and test-matrix profile of all.

---

## 8. Is the generic intake scenario strong enough?

Assessing **Enterprise Customer Intake Modernization** as specified (multi-channel intake, document processing/OCR, validation, human review, downstream integration, events, audit, sensitive-data controls):

- **Concrete enough?** Yes, *if* it keeps named components and named failure modes. The current claims architecture (Intake API, Document Upload, Validation Worker, Intake DB, Document Storage, Handoff Queue, Operations Portal, Audit Event Store) maps 1:1 with only two renames (FHIR Validation Worker ΓåÆ Document Validation Worker; Adjudication Handoff ΓåÆ Case/Decision Handoff). **Proven** reuse path.
- **Too generic?** The risk is real but manageable: 7 of the 10 proposed findings already exist in the claims spine in generic form (idempotency, OCR bypass, retry inconsistency, retention divergence, events-before-commit, DR evidence gap, review-queue recovery). The two weakest proposed findings ("sensitive data collected earlier than required" and "AI classification lacks confidence thresholds") need concrete policy hooks: recommend anchoring the first to the existing data-classification/GDPR bundled packs and the second to the existing AI-governance pack ΓÇö both already ship in `DefaultPolicyPacks/Bundled/`.
- **Evidence/governance story weakened?** No ΓÇö evidence traces, signed record, approvals, and compare mechanics are scenario-agnostic (Proven: they render Northwind created-sample content today).
- **Sponsor metrics?** The illustrative-savings mechanism (`SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD`) is scenario-agnostic; re-derive the number for the new narrative.
- **Cloud posture?** Keep it an **Azure reference architecture with honest labeling** (the TB-778 pattern), consistent with ADR 0020. Do not fake neutrality.
- **Executive comprehension?** Better than claims (no vocabulary tax) but keep the hero finding *visceral* ΓÇö recommend "sensitive personal data crosses the intake boundary before minimization" as the direct generic descendant of the PHI hero, mapped to privacy/data-minimization policy rather than HIPAA.

**Adjustment recommended:** one hero finding, not ten equals ΓÇö the claims spine works because PHI minimization is a single memorable spike with eight supporting decisions. Reproduce that shape.

---

## 9. Architecture creation versus review

The prior assessment already found creation "underrepresented" on the showcase (┬º14, 2026-07-19). Repository state:

- **Review:** fully demonstrated (the entire claims spine).
- **Creation:** demonstrated by the Northwind Copilot RAG **created package** (TB-742) and the compare-created-vs-reviewed demo script (TB-745) ΓÇö but these sit *beside* the funnel, not *in* it.

**Recommended narrative (no long tutorial):** the generic primary showcase should open with a two-beat framing ΓÇö "this architecture was *described and generated* in ArchLucid, then *reviewed* against policy" ΓÇö with one creation artifact (the intake brief / generated package card) linked before the findings strip. That is a content change inside the existing showcase body, not a new surface. The full creation story remains the created-sample's job.

---

## 10. Cloud and vendor neutrality

- ArchLucid is **deliberately, documentedly Azure-primary** (ADR 0020: "planned-permanent"; ICP disqualifies AWS/GCP-only buyers; positioning honesty rule forbids implying multi-cloud). Assessing the showcase against a cloud-neutrality ideal would contradict the product's own strategy.
- Therefore: the sample *should* remain a concrete Azure reference architecture, clearly labeled (TB-778 already does this). AWS/GCP policy packs exist (TB-701+ cluster) for buyers who need them; multi-cloud analysis is V1.1 scope. Distinguish concrete implementation (fine) from product bias (already explicit and owned).
- **Contoso would add Microsoft flavor with zero capability payoff** ΓÇö the one neutrality improvement available cheaply is *not* adopting more Microsoft fictional branding, and eventually retiring buyer-visible Contoso/Northwind labels.

---

## 11. Content and terminology consistency

Names currently in use for overlapping things: *Claims Intake Modernization*, *Claims Intake Modernization Review*, *Healthcare claims sample*, *sample review* / *sample review package* (the copy-audit canonical), *governed sample review*, *showcase*, *illustrative sample*, *interactive sample*, *live preview* (flagged misleading; TB-888 replaced with "illustrative"), *See it in 30 seconds*, *Quick start* (an operator intake path, not the showcase), *Quick Scan* (a different product), *Demo operations*, *Start an evaluation*.

**Recommended hierarchy** (compatible with the existing copy audit):

| Level | Term |
|---|---|
| Showcase section (public) | **Showcase** |
| Scenario name | **Enterprise Customer Intake Modernization** (primary) / **Healthcare Claims Intake Modernization** (secondary) |
| Sample architecture | "{Scenario} reference architecture (Azure)" |
| Sample review | **Sample review** (canonical per `COPY_TERMINOLOGY_AUDIT.md`) |
| Interactive experience | **Interactive sample** |
| Static fallback disclosure | **Illustrative sample** (TB-888 language) |
| Sponsor surface | **Sponsor report** |

Route names, titles, breadcrumbs, exports, and analytics dimensions should carry the scenario slug consistently ΓÇö which requires the analytics gap in ┬º15 to be fixed first.

**Sharpest inconsistency to fix immediately (independent of any scenario decision):** `/see-it` banners "Healthcare claims sample" and `/demo/preview` titles "Claims Intake Modernization" over the Contoso-backed `GET /v1/demo/preview` path. Two fictional universes on one funnel. This is the M-107 decision plus a copy fix ΓÇö hours of work.

---

## 12ΓÇô13. Technical implementation and sample-data architecture

**Does the current architecture support multiple scenarios cleanly? No ΓÇö but it is close.** The static-payload pattern itself is sound (bundled, deterministic, zero AI cost, survives deploys ΓÇö all Proven by the prior assessment). What blocks a second scenario:

1. The ┬º4.2 helper couplings (scenario knowledge in shared components).
2. Single-scenario constants scattered across `showcase-static-demo.ts`, `operator-static-demo.ts`, `buyer-polish-copy.ts`, `breadcrumb-map.ts`, `demo-run-canonical.ts`, `next.config.ts`.
3. Tests assert literal healthcare strings rather than reading from the payload.

**Recommendation: adopt the versioned sample-package layout ΓÇö as TypeScript modules, not a new framework.** The proposed `/samples/{scenario}/{manifest,architecture,reviews,findings,evidence,decisions,sponsor-report,policy-assignments}` structure maps naturally onto a per-scenario TS module directory exporting one typed `SampleScenarioDefinition`; shared helpers read from the definition instead of branching on IDs. This is a refactor of existing files, not new infrastructure ΓÇö the coupling inventory justifies exactly this much and no more. Benefits, in order of realized value: **testability** (tests assert against the definition, killing the 80-file literal-string lock-in), **scenario creation** (authoring becomes content work), **content ownership** (one directory per scenario), **sample repair/versioning** (payload version field already exists in spirit via `healthcare-claims-v3 @ 3.4.1`). Deployment reliability is already good (static bundle) and does not improve materially. Since the spine is not SQL-seeded, **no schema migration is involved** ΓÇö a major cost the prompt anticipated that repository evidence removes.

Keep the backend Contoso/Northwind/Alpine SQL seed family as-is; it serves trial tenants, a different job.

---

## 14. Policy-pack and finding portability

Per-finding classification of the claims spine (from `showcase-static-demo.ts` decision synopses and home findings):

| Finding / decision theme | Portability |
|---|---|
| PHI Minimization Risk (hero) | **Reusable with terminology + policy remap** ΓåÆ "sensitive-data minimization at intake boundary" mapped to privacy/data-classification packs instead of HIPAA. Loses some punch; see ┬º8 |
| Adjudication handoff idempotency | **Fully reusable** (rename handoff) |
| OCR/document validation bypass gates | **Fully reusable** |
| Back-pressure / bounded queues | **Fully reusable** |
| Retention divergence across stores | **Reusable with terminology changes** (drop healthcare retention citations) |
| Data residency boundary | **Fully reusable** |
| DR claims lack evidence | **Fully reusable** |
| Observability / rework queues / feature flags | **Fully reusable** |
| HIPAA pack mapping, healthcare retention specifics, FHIR validation naming | **Healthcare-specific ΓÇö keep only in the healthcare scenario** |

Policy assignment for the generic scenario: general security baseline + privacy/data-minimization + reliability/resiliency + FinOps + AI-governance packs ΓÇö **all already exist** in `DefaultPolicyPacks/Bundled/`. The evidence/governance story does not weaken: 7 of 9 finding themes port with their evidence shapes intact. Confidence: **Strong evidence**.

---

## 15. Conversion and analytics

Current state (Proven): **none of the questions can be answered.** There are no showcase-view events (TB-891 open), the route normalizer collapses `/reviews/{id}` to `/reviews/[runId]` so the scenario slug is not an analytics dimension, and live-demo/funnel telemetry doesn't distinguish scenarios. Healthcare-vs-other buyer behavior is **Not determined** and currently unmeasurable.

**Required before any scenario comparison:** ship TB-891 (`showcase_viewed`, `showcase_render_mode`) extended with a `scenario` dimension; add scenario tags to QuickNav clicks, finding opens, evidence opens, demo requests, and signups. Without this, replacing the primary example would be flying blind ΓÇö the prompt's warning ("do not assume the generic example will perform better without a way to measure it") is confirmed by repository evidence.

---

## 16. Cost and maintenance

Per product release, each fully independent scenario costs: content review on schema/UI changes, screenshot refresh (M-108-class work), test-suite maintenance, doc updates. Estimated steady-state (rough, **Likely** confidence):

| Portfolio | Marginal per-release cost | Notes |
|---|---|---|
| One example (today) | Baseline | Already paid; 80+ test files, QA checklist, docs |
| Two examples (recommended) | +30ΓÇô50% of baseline sample cost ΓÇö **less** after the ┬º13 refactor (tests read definitions) | The refactor is partially self-funding: it cuts per-scenario test churn |
| Three examples | +60ΓÇô80% pre-refactor; +40% post | Third scenario should reuse Northwind created assets |
| Industry skins (6+) | Unbounded content-drift risk | Rejected (┬º7) |
| Fully independent datasets | Highest | No justification found |

Multiple examples would slow development materially **only if** the literal-string test coupling persists. **Smallest portfolio with meaningful breadth: two** (generic primary + healthcare secondary), with the AI/created sample formalized as a third later at low marginal cost.

---

## 17. Weighted options comparison (final choices)

**Weights** (sum 100): market breadth 10, credibility 10, clarity 10, differentiation 5, demonstration depth 10, implementation effort 10 (higher = cheaper), maintenance 7 (higher = cheaper), cloud neutrality 2, industry neutrality 6, regulated credibility 8, AI-governance relevance 4, controlled-beta suitability 4, public-promotion suitability 7, enterprise-sales suitability 7.

| Criterion (wt) | A Keep healthcare only | B Rename w/ Contoso | C Generalize in place | D Generic primary + healthcare secondary | E Three scenarios |
|---|---|---|---|---|---|
| Market breadth (10) | 40 | 45 | 80 | 85 | 95 |
| Credibility (10) | 80 | 35 | 65 | 85 | 80 |
| Clarity (10) | 60 | 45 | 75 | 80 | 70 |
| Differentiation (5) | 70 | 25 | 55 | 70 | 75 |
| Demo depth (10) | 90 | 70 | 70 | 90 | 90 |
| Impl. effort (10) | 100 | 55 | 40 | 45 | 25 |
| Maintenance (7) | 90 | 70 | 85 | 60 | 40 |
| Cloud neutrality (2) | 45 | 30 | 55 | 55 | 55 |
| Industry neutrality (6) | 35 | 50 | 85 | 85 | 90 |
| Regulated credibility (8) | 95 | 50 | 55 | 90 | 90 |
| AI-gov relevance (4) | 45 | 40 | 55 | 60 | 90 |
| Beta suitability (4) | 85 | 50 | 55 | 70 | 55 |
| Public promotion (7) | 55 | 35 | 70 | 85 | 80 |
| Enterprise sales (7) | 65 | 40 | 65 | 85 | 85 |
| **Weighted total** | **71** | **48** | **66** | **77** | **74** |

**Winner: Option D (77)**, with Option A (71) as the correct *interim* posture during controlled beta and Option E (74) as the natural post-launch extension. Option B ΓÇö the Contoso rename ΓÇö is decisively last (48): it pays most of the migration cost of Option C while gaining none of the breadth and adding Microsoft-brand entanglement plus internal contradiction risk.

---

## 18. Final recommendation, migration approach, prioritized backlog

### Final recommendation

Adopt **Option D via sequenced phases**, keeping the controlled beta on the existing Claims Intake spine:

- **Phase 0 ΓÇö Coherence (now; days).** Owner resolves **M-107**; fix the `/see-it` "Healthcare claims sample" banner and `/demo/preview` "Claims Intake Modernization" title so labels match the data behind them; ship **TB-891** telemetry with a scenario dimension; capture **M-108** screenshots only after naming settles.
- **Phase 1 ΓÇö Decouple (2ΓÇô3 weeks).** Extract the ┬º4.2 helper couplings into a typed per-scenario sample-definition layer (┬º13); migrate tests to assert against definitions. No visible behavior change; verifiable by existing test suite.
- **Phase 2 ΓÇö Author (3ΓÇô5 weeks).** Build **Enterprise Customer Intake Modernization** as a second sample package reusing the ┬º14 portable findings, with one hero finding (sensitive-data minimization at intake, mapped to privacy/data-classification packs), an Azure reference architecture honestly labeled, and a two-beat creation+review narrative (┬º9).
- **Phase 3 ΓÇö Flip (1 week + validation window).** Make the generic scenario the default on `/get-started`, homepage, and SEO paths; keep healthcare claims as the linked vertical-depth example and the healthcare vertical's `publicSampleHref`. Compare telemetry before deleting anything.
- **Later (V-next).** Formalize the AI Knowledge Assistant scenario from the Northwind created sample + Workspace B assets; retire buyer-visible Contoso/Northwind labels.

### Validation plan (lightweight)

Sufficient evidence to flip the default: (a) TB-891 scenario-tagged funnel data showing the generic scenario's showcaseΓåÆfinding-openΓåÆsignup rates at parity or better over a comparison window; (b) landing/LinkedIn framing variants (fits existing content cadence) showing comprehension signals; (c) 3ΓÇô5 informal scenario-concept reactions gathered opportunistically through existing owner conversations and the already-open proof-packet cohort rows (**G-REAL-06/07**). Deliberately **not** proposed: new formal cohort programs ΓÇö scenario validation should ride existing GTM V1.1 rows, not create parallel research programs.

### Prioritized backlog (opened 2026-07-23)

| P | Item | Canonical ID | Depends on |
|---|---|---|---|
| P0 | Owner IA ΓÇö canonical public proof funnel | **M-107** (**Done** 2026-07-29 — Option A) | ΓÇö |
| P0 | Owner ratify Option D (generic primary + healthcare secondary; no Contoso) | **M-133** (**Done** 2026-07-29) | ΓÇö |
| P0 | `/see-it` + `/demo/preview` label/data alignment | **M-134** (**Done** — honest co-primary matrix) | M-107, M-133 |
| P1 | Showcase scenario telemetry (`scenario` + funnel) | **TB-978** (extends **TB-891**) | ΓÇö |
| P1 | Sample-definition extraction refactor | **TB-979** | TB-978 preferred |
| P1 | Naming hierarchy + Contoso/Northwind buyer-org ban | **M-135** | M-133 |
| P1 | Screenshots after naming settles | **M-108** (already open) | M-107, M-133 |
| P1 | Author Enterprise Customer Intake Modernization package | **TB-980** | TB-979, M-133, M-135 |
| P1 | Lightweight scenario validation | **M-136** | TB-978; rides G-REAL-06/07 |
| P1 | Default flip + SEO/get-started/trial alignment | **TB-981** | TB-978, TB-980, M-133, M-134, M-136 |
| P2 | Formalize AI scenario + Contoso/Northwind buyer-label cleanup | **TB-982** | TB-981, M-135 |
| P2 | Optional fictional-org trademark screen | **M-137** | M-135 if org name used |

---

## 19. Required final decisions

| # | Question | Answer | Confidence |
|---|---|---|---|
| 1 | Is Claims Intake too healthcare-specific to remain the primary example? | **As the sole long-term primary, yes (Likely); for the controlled beta, no.** The compounding defect is funnel incoherence (three storylines), not healthcare per se | Strong evidence |
| 2 | Remove, generalize, or retain as secondary? | **Retain as the secondary regulated-depth example.** Neither remove nor generalize in place | Strong evidence |
| 3 | Should ArchLucid use Contoso? | **No** for buyer-facing showcase naming. Keep internal seed identifiers short-term; schedule buyer-visible Contoso (and Northwind) label cleanup | Strong evidence |
| 4 | Primary scenario name? | **Enterprise Customer Intake Modernization** | Likely |
| 5 | Fictional organization name? | Optional; only in narrative copy, never in routes/IDs. Avoid Contoso/Northwind (Microsoft) and Meridian (already used in-repo). Shortlist Northstar Group / HarborPoint pending trademark screen | Uncertain (trademark not assessed) |
| 6 | Scenario or organization name dominant in UI? | **Scenario name dominant** | Strong evidence |
| 7 | One, two, or three examples at launch? | **Beta: one (current). Public promotion: two.** Third formalized later from existing created-sample assets | Strong evidence |
| 8 | Enterprise AI Knowledge Assistant at launch? | **Not as a third full spine** ΓÇö it substantially exists as `northwind-copilot-rag-platform` + Workspace B; formalize post-flip | Strong evidence |
| 9 | Which healthcare assets reuse safely? | Full architecture topology (8 components, 2 renames), 7 of 9 finding themes, evidence-trace/compare/signed-record/approval mechanics, sponsor-metric mechanism | Proven (mechanics) / Strong evidence (findings) |
| 10 | Which details must stay healthcare-only? | PHI minimization framing + HIPAA/healthcare-claims pack mapping, adjudication vocabulary, FHIR validation naming, healthcare GTM packets, healthcare retention citations | Proven |
| 11 | Lowest-risk implementation strategy? | Decouple first (sample-definition layer), author second scenario as new package, flip default after telemetry comparison. **Never rename in place** | Strong evidence |
| 12 | Required before public promotion? | M-107 decision; `/see-it`+`/demo/preview` label/data alignment; TB-891 scenario telemetry; M-108 screenshots after naming settles | Strong evidence |
| 13 | What should not change yet? | Existing spine slugs/redirects/tests; backend Contoso/Northwind/Alpine SQL seeds; bundled HIPAA and other policy packs; Northwind created sample; trial bootstrap | Proven (coupling cost) |

---

## 20. Material findings register

| # | Finding | Evidence | Severity | Confidence | Buyer impact | Product impact | Technical impact | Recommendation |
|---|---|---|---|---|---|---|---|---|
| F-01 | Three parallel "primary examples" with colliding labels (Claims static / Contoso live / Northwind created); `/see-it` banners healthcare over Contoso-backed data | `see-it` page copy; `DEMO_PREVIEW.md`; `MarketingShowcaseController.TryResolveRunId`; prior assessment ┬º7 | **High** | Proven | Confusing first impression; erodes trust on close reading | Undermines every funnel metric | Low (copy + IA decision) | Resolve M-107; align labels to data |
| F-02 | Contoso already embedded as live-demo/trial universe; Northwind also Microsoft-named | `ContosoRetailDemoIdentifiers.cs`, migration 110, `TrialTenantBootstrapService.cs`, `TRIAL_ONBOARDING_SAMPLE_RUN_ID` | Medium | Proven | Microsoft-extension perception if surfaced | Naming decision has an installed base | Rename churn if forced | Don't extend Contoso to buyer-facing naming; defer internal cleanup |
| F-03 | ~15 shared UI helpers branch on PHI/healthcare identifiers | ┬º4.2 list (`finding-display-from-inspect.ts`, `graph-mapper.ts`, `policy-pack-detail-resolver.ts`, ΓÇª) | **High** | Proven | None directly | Blocks any second scenario cleanly | Refactor required before portfolio | Sample-definition extraction (┬º13) |
| F-04 | 80+ tests lock literal healthcare strings and spine counts | Test inventory; `ExecutiveReviewPacketDemoFixture.cs` | Medium | Proven | None | Raises cost of every scenario change | Test churn on any rename | Migrate assertions to definitions during refactor |
| F-05 | Claims spine is static TS, not SQL-seeded; no AI in path; shared read-only | `showcase-static-demo.ts`; prior assessment ┬º9, ┬º11 | Info (positive) | Proven | Reliable demo | Cheap to replicate pattern | No schema migration needed for new scenarios | Reuse pattern for generic package |
| F-06 | Trial onboarding sample is Contoso baseline GUID, not Claims ΓÇö marketing promise and trial reality diverge | `TRIAL_ONBOARDING_SAMPLE_RUN_ID`; `DEMO_WORKSPACES.md` | Medium | Proven | Marketing shows healthcare; trial shows retail | Weakens showcaseΓåÆtrial continuity | Alignment work in flip phase | Align trial sample with chosen primary scenario at Phase 3 |
| F-07 | No scenario-level analytics; slug stripped from route dimension; TB-891 open | `live-demo-telemetry.ts`; route normalizer; prior assessment ┬º14 | **High** (for this decision) | Proven | ΓÇö | Cannot compare scenarios post-launch | Small | Ship TB-891 + scenario dimension before flip |
| F-08 | Healthcare specificity is a wedge for regulated ICP, a tax elsewhere; ICP is multi-vertical, Azure-primary | `BUYER_PERSONAS.md` (ICP) §2; `POSITIONING.md`; prior assessment §19 | Medium | Strong evidence | Two-thirds of ICP must self-translate | Ceiling on public promotion | — | Option D |
| F-09 | Creation underrepresented in the funnel despite created-sample assets existing | Prior assessment ┬º14; TB-742/745 | Medium | Proven | Product looks review-only | Misses half the value prop | Content change only | Two-beat creation+review framing (┬º9) |
| F-10 | "Healthcare Claims Policy Pack v3.4.1" is UI narrative with no backend pack; real HIPAA pack exists separately | No `demo-healthcare-claims-pack` in C#/SQL; `hipaa-architecture.json` bundled | Low | Proven | Minor honesty risk if probed | Narrative/runtime divergence | Trivial | Note in scenario definition; keep HIPAA pack regardless |

---

## 21. Evidence appendix

| Topic | Location |
|---|---|
| Static showcase payload + IDs | `archlucid-ui/src/lib/showcase-static-demo.ts` |
| Operator static spine | `archlucid-ui/src/lib/operator/operator-static-demo.ts` |
| Static-first gating | `archlucid-ui/src/lib/showcase-page-resolution.ts` |
| Slug canonicalization + aliases | `archlucid-ui/src/lib/demo-run-canonical.ts`, `archlucid-ui/next.config.ts` |
| Marketing API slug resolution (Contoso-only) | `ArchLucid.Api/Controllers/Marketing/MarketingShowcaseController.cs` |
| Backend demo seed family | `ArchLucid.Application/Bootstrap/DemoSeedService.cs`, `ContosoRetailDemoIdentifiers.cs`, `CreatedSampleWorkspaceSeed.cs`, `RegulatedScenarioWorkspaceSeed.cs` |
| Trial bootstrap (Contoso per-tenant) | `ArchLucid.Application/Tenancy/TrialTenantBootstrapService.cs` |
| `IsPublicShowcase` flags | `ArchLucid.Persistence/Migrations/110_Runs_IsPublicShowcase.sql` |
| Shared-helper healthcare couplings | ┬º4.2 file list |
| Bundled policy packs (incl. HIPAA, privacy, AI governance) | `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/` |
| Healthcare architecture components | `docs/go-to-market/Architect_Evaluation/Packets/healthcare_claims_intake_PARTICIPANT.md` |
| Prior showcase assessment | `docs/architecture/showcase_claims_intake_modernization_assessment_2026_07_19.md` |
| ICP / positioning / vertical brief | `docs/go-to-market/BUYER_PERSONAS.md` (ICP), `POSITIONING.md`, `buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` |
| Open decision + screenshot rows | `docs/go-to-market/GTM_BACKLOG.md` M-107, M-108 |
| Terminology canon | `docs/ux-audits/COPY_TERMINOLOGY_AUDIT.md` |
| Telemetry gap | `archlucid-ui/src/lib/live-demo-telemetry.ts`; TB-891 |

### Unproven / not determined

| Item | Why |
|---|---|
| Actual buyer comprehension and conversion by scenario | No telemetry (TB-891 open); no interviews in this pass |
| Trademark status of candidate fictional names | Not legally assessed |
| Production render mode of the showcase today | No live fetch in this pass (same gap as prior assessment ┬º25) |
| Effort estimates (┬º4.3, ┬º18) | Derived from coupling inventory; no timed spike |
