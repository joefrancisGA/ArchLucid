> **Reviewed:** 2026-07-29
>
> **Scope:** GTM **M-134** — honest co-primary sample-package map (surface → package → IDs). Internal GTM/ops; not a buyer brochure. Funnel IA (**M-107** Option A) in §1a; Option D ratification (**M-133**) in §1b.

# Sample-package funnel ID matrix (M-134)

**Last reviewed:** 2026-07-29  
**Status:** Shipped as **honest co-primary** documentation (two buyer-facing packages + one SE-only package). **M-107** + **M-133** Done — cold funnel stays **P-CLAIMS** until **TB-981**; long-term primary name = Enterprise Customer Intake. Package authoring / default flip: **TB-979**–**TB-981**.  
**PA Q21 minimum:** `/see-it` Claims-static (Option A) — Contoso/unknown live payloads fall back to Claims snapshot; never Contoso under Healthcare Claims chrome. Owned with **M-178** / **TB-1028**. **Northwind** stays **off primary funnel**.

---

## 1a. M-107 owner decision (2026-07-29) — Option A Claims-static

| Decision | Value |
|----------|--------|
| Canonical anonymous public proof path | `/showcase/claims-intake-modernization` (**P-CLAIMS**) |
| Welcome → `/see-it` → primary CTA | Claims sample / showcase — **not** Contoso `/demo/preview` |
| `/see-it` body source | Prefer Claims live only; Contoso or unknown → checked-in Claims snapshot |
| Contoso `/demo/preview` | **Secondary** Product Tour / self-demo only (Contoso-labeled) |
| Get-started vertical samples + Why Verify demo links | All → Claims showcase |
| Still open (execution) | **TB-980** (author Enterprise package) · **TB-981** (default flip) · **M-135** (naming hierarchy) |

Constant in UI: `CANONICAL_ANONYMOUS_PROOF_HREF` in `archlucid-ui/src/lib/showcase-static-demo.ts`.

---

## 1b. M-133 owner decision (2026-07-29) — Option D ratified

| Pin | Value |
|-----|--------|
| Long-term primary scenario | **Enterprise Customer Intake Modernization** |
| Secondary regulated-depth | **Healthcare Claims Intake Modernization** |
| Contoso / Northwind in primary one-sentence or primary CTA org chrome | **Forbidden** |
| Until **TB-981** | Cold funnel + routes stay on Claims spine (**M-107**); this ratification is naming/portfolio intent only |

Full owner note: [`DEMO_PREVIEW.md`](../library/DEMO_PREVIEW.md) § Owner ratification — showcase Option D. Assessment: [`showcase_scenario_strategy_assessment_2026_07_23.md`](../architecture/showcase_scenario_strategy_assessment_2026_07_23.md) §17–§19.

**PA one-sentence:** ArchLucid’s primary buyer-facing sample is Enterprise Customer Intake Modernization — a governed architecture proof package for modernizing how an enterprise intakes and processes customer work, with evidence-backed findings you can commit and export.

---

## 1. Verdict (what “aligned” means today)

Marketing, trial, showcase, and SQL seeds are **not** one fictional universe. Treat them as **three named packages** and never mix labels across packages on the same page or CTA. Cold funnel proof CTAs use **P-CLAIMS** only (§1a). Long-term primary *name* is Enterprise Customer Intake (§1b) — package not authored yet (**TB-980**).

| Package ID (internal) | Buyer-facing scenario name | Storyline / synthetic orgs | Primary use |
|-----------------------|----------------------------|----------------------------|-------------|
| **P-CLAIMS** | Healthcare Claims Intake Modernization | Static showcase / UI fixtures (`claims-intake-modernization`) | Public showcase, `/try`, Tier-1 UI routes, frictionless marketing (**current** cold funnel) |
| **P-ENTERPRISE-INTAKE** (planned) | Enterprise Customer Intake Modernization | TBD sample-definition (**TB-979**/**TB-980**) | **Long-term primary** after **TB-981** flip — not a live route yet |
| **P-PRODUCT-TOUR** | Product Tour / self-demo (Workspace A) | Contoso Cloud Platform · Northwind Architects (fabricated) | Welcome **Try the self-demo**, `NEXT_PUBLIC_SELF_DEMO_URL`, preferred `trialSampleRunId` |
| **P-REGULATED** | Alpine AI governance (Workspace B) | Meridian Advisory Group · Alpine Health | Regulated wedge demos, AI-gov / security-baseline seed engines |

---

## 2. Surface → package → IDs

| Surface / knob | Package | Route / API | Stable ID(s) | Label rules |
|----------------|---------|-------------|--------------|-------------|
| Public showcase | **P-CLAIMS** | `/showcase/claims-intake-modernization` | Slug `claims-intake-modernization` | “Illustrative sample” / Healthcare Claims — **not** live Contoso preview |
| Frictionless trial launcher | **P-CLAIMS** | `/try` → `/reviews/claims-intake-modernization` | Same slug | Same as showcase |
| Operator Tier-1 review package | **P-CLAIMS** | `/reviews/claims-intake-modernization` (+ findings / provenance / snapshot) | Same slug; finding e.g. `phi-minimization-risk` | Static package; may inject client-only when demo pin empty (**TB-1039**) |
| Welcome secondary CTA “Try the self-demo” | **P-PRODUCT-TOUR** | `NEXT_PUBLIC_SELF_DEMO_URL` (default `/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` → 301 → `/reviews/...`) | `DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId` = `b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` | Contoso / Product Tour — **never** “Claims Intake” |
| Post-registration “Open example review” | **P-PRODUCT-TOUR** (preferred) | `GET /v1/tenant/trial-status` → `trialSampleRunId` | Prefer Product Tour GUID above; if different, document beside `NEXT_PUBLIC_SELF_DEMO_URL` in the deploy runbook | Must match onboarding copy |
| Anonymous live demo preview | **P-PRODUCT-TOUR** (Contoso seed) | `/demo/preview`, `GET /v1/demo/preview`, `/demo/explain` | Contoso authority baseline `6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501` (`ContosoRetailDemoIdentifiers.AuthorityRunBaselineId`); hardened pair `…c502` | Banner/universe = Contoso (or unknown fail-closed) — **not** Healthcare Claims |
| `/see-it` pitch + body | **P-CLAIMS** (M-107 Option A) | `/see-it` (Claims live or Claims snapshot; Contoso/unknown → snapshot) | Claims snapshot / Claims live only | Primary CTA → `/showcase/claims-intake-modernization` — never Contoso `/demo/preview` on this chain |
| Workspace A deep link (Sales) | **P-PRODUCT-TOUR** | `/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` | Workspace `2b2571e1-1884-62a2-1e8b-15a2a70a0342` · Project `9beb918c-83d4-1385-0486-21f341806c5c` | Scope headers must match |
| Workspace B deep link (SE / regulated) | **P-REGULATED** | `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b` | Workspace `3f1a16c3-172e-5632-c53a-3ed16446f603` · Project `49074cdf-bdab-a5fa-789b-09a3e556a8f2` | Meridian/Alpine; seed engines — not live multi-agent (**M-111**) |
| Northwind compare / creation bridge | **Off-funnel** | e.g. `northwind-copilot-rag-platform` in longer scripts | Fixture slugs only | Do **not** use in welcome → `/see-it` → primary CTA |
| Why-ArchLucid / measured ROI demo pin | Contoso string key | API snapshot fields | `ContosoRetailDemoIdentifiers.RunBaseline` = `6e8c4a102b1f4c9a9d3e10b2a4f0c501` | Sponsor numbers labeled demo — replace before publish |

Pinned Workspace A/B GUID table (CI): [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md). Narrative + scope: [`DEMO_QUICKSTART.md#demo-workspaces`](DEMO_QUICKSTART.md#demo-workspaces). Route tiers: [`../architecture/ui_routes.md`](../architecture/ui_routes.md).

---

## 3. Forbidden mixes (toxic)

| Mix | Why it fails |
|-----|----------------|
| Claims chrome / title + Contoso `GET /v1/demo/preview` payload | Dual universe — PA Q21 / **M-178** |
| “Healthcare Claims” CTA → Product Tour GUID | Wrong package |
| Primary buyer one-sentence naming Contoso or Northwind as the customer | Toxic marketing (**M-135**) |
| Northwind on welcome / `/see-it` / paid creatives | Off-funnel |
| Implying showcase slug is the same SQL row as Product Tour / Contoso authority runs | Different stores (static vs seeded) |

---

## 4. Deploy / Sales checklist

1. Set **`NEXT_PUBLIC_SELF_DEMO_URL`** to Workspace A (`/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` preferred).  
2. Confirm **`trialSampleRunId`** for evaluator tenants matches that Product Tour run (or document the exception).  
3. Before paid creatives: open the exact URL the creative names — Claims showcase **or** Contoso preview — and match the banner.  
4. For regulated demos, bookmark Workspace B; do not reuse Claims or Contoso labels.  
5. After **M-133**: collapse creatives to Enterprise Customer Intake if ratified; until then paid/SEO proof creatives land on Claims showcase (§1a).

---

## 5. Residuals (not closed by M-134)

| Residual | Owner |
|----------|--------|
| Canonical anonymous proof path (showcase vs `/see-it` vs `/demo/preview`) | **M-107** **Done** — Option A (§1a) |
| Option D primary scenario sentence (Enterprise Customer Intake) | **M-133** **Done** — §1b; execution **TB-980**/**TB-981** |
| Sample-definition package engineering / default flip | **TB-979**–**TB-981** |
| Naming hierarchy + safe/toxic org matrix prose | **M-135** |
| Screenshots / video on ratified creatives | **M-108** / **M-07** / **M-16** |

---

## Related

- [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md) · [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md)  
- [`MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md`](MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md) (**M-179**)  
- [`LIVE_DEMO_SEE_IT_LADDER_PA_ONE_PAGER.md`](LIVE_DEMO_SEE_IT_LADDER_PA_ONE_PAGER.md) (**M-260**)  
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — **M-134**, **M-107**, **M-133**  
- [`DEMO_PREVIEW.md`](../library/DEMO_PREVIEW.md) — Option D owner note
