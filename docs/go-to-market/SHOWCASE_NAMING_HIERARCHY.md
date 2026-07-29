> **Reviewed:** 2026-07-29
>
> **Scope:** GTM **M-135** — showcase naming hierarchy + PA Q4 safe-seed vs toxic-marketing matrix. Internal GTM/ops; not a buyer brochure.

# Showcase naming hierarchy + Contoso/Northwind matrix (M-135)

**Last reviewed:** 2026-07-29  
**Status:** Shipped. Depends on **M-133** (Option D ratified) and **M-107** (Claims-static cold funnel). Does **not** rename routes or SQL seeds.  
**Pairs:** **M-137** (optional fictional-org trademark screen — only if narrative needs a company name) · engineering **TB-980**/**TB-982**

---

## 1. Scenario-first naming hierarchy

Use this stack in buyer-facing UI, paid creatives, SEO, and SE talk tracks. Prefer the **highest** term that is still accurate.

| Layer | Term (preferred) | Meaning | Example |
|-------|------------------|---------|---------|
| 1 | **Showcase** | Public, no-sign-in sample surface | `/showcase/claims-intake-modernization` |
| 2 | **Scenario name** | Named architecture storyline (not a customer brand) | Healthcare Claims Intake Modernization · *(long-term primary)* Enterprise Customer Intake Modernization |
| 3 | **Sample review** / **sample architecture package** | The review object buyers open | “Open healthcare claims sample review” |
| 4 | **Illustrative sample** | Disclosure that content is synthetic / not the visitor’s estate | Banner / footer disclosure |

**Avoid as primary chrome:** “demo customer,” “Contoso review,” “Northwind package,” “live preview” for static Claims showcase, “seeded run” in buyer copy.

**Synonyms allowed sparingly:** “example review” (operator empty states only). Prefer **sample** on marketing per [`COPY_TERMINOLOGY_AUDIT.md`](../ux-audits/COPY_TERMINOLOGY_AUDIT.md).

### Long-term vs current cold funnel

| Role | Scenario name | Live today? |
|------|---------------|-------------|
| Long-term **primary** (name pin) | Enterprise Customer Intake Modernization | Not yet — **TB-980** / **TB-981** |
| **Secondary** regulated-depth | Healthcare Claims Intake Modernization | **Yes** — canonical anonymous proof (**M-107**) |
| Product Tour (secondary CTA) | Contoso-labeled self-demo / `/demo/preview` | Yes — never under Claims chrome |
| Off-funnel | Northwind fixtures / longer SE scripts | Yes — not welcome → `/see-it` → primary CTA |

**PA one-sentence (from M-133):** ArchLucid’s primary buyer-facing sample is Enterprise Customer Intake Modernization — a governed architecture proof package for modernizing how an enterprise intakes and processes customer work, with evidence-backed findings you can commit and export. **Never in that sentence:** Contoso, Northwind.

Until **TB-981**, public creatives that open Claims must name **Healthcare Claims Intake** (or “Claims sample”), not Enterprise Customer Intake as if the package already exists.

---

## 2. PA Q4 — safe internal vs toxic marketing vs gray

### (1) Safe internal — keep; do not demand rename for Done

| Item | Why safe |
|------|----------|
| Contoso SQL pins / `ContosoRetailDemoIdentifiers` | Internal seed identity; not buyer org brand |
| Contoso Retail storyline in operator/demo seed docs | Engineering + SE seed narrative |
| Northwind fixture reuse in tests / longer scripts | Fixture continuity |
| Meridian Advisory / Alpine Health (Workspace B) | Regulated wedge seed; cite in SE docs |
| GUIDs, `IsDemoData`, `isDemoData: true` | Honest synthetic markers |
| Class names / route IDs containing Contoso for Product Tour | Code/API stability |

**Do not** treat Contoso SQL rename as a Done criterion for this row.

### (2) Toxic marketing — ban in buyer-facing showcase / primary CTA / paid creatives

| Anti-pattern | Why toxic |
|--------------|-----------|
| Contoso or Northwind as the **showcase organization** or customer brand | Microsoft fictional-brand entanglement; implies real customer |
| Contoso / Northwind in the **primary-scenario one-sentence** | Violates **M-133** pin |
| Contoso / Northwind in **primary CTA chrome** (welcome hero proof CTA, paid landing primary button) | Wrong package signal |
| Contoso payload under **Healthcare Claims** chrome | Dual universe (**M-178** / PA Q21) |
| Implying Contoso/Northwind/Meridian are **real customers** or reference logos | False social proof |
| “Live Contoso demo” as the **canonical** anonymous proof path | Superseded by **M-107** Option A |

### (3) Gray — allowed with constraints

| Item | Constraint |
|------|------------|
| Contoso-labeled `/demo/preview` / Product Tour | Secondary CTA only; banner must say Contoso / Product Tour — never Claims |
| SE demo scripts that still say Contoso/Northwind | Rewrite over time (**TB-982**); do not use on paid creatives |
| [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md) / seed docs naming Contoso/Northwind | **Superseded for public showcase/paid creatives**; operator seed docs may still name them |
| Optional fictional org in long-form narrative | Prefer scenario-first with **no** org name; if needed, screen via **M-137** (not Contoso/Northwind/Meridian for new creatives) |
| Workspace B Meridian/Alpine in regulated demos | SE / Workspace B path only — not primary marketing one-sentence |

---

## 3. Quick checklist (creatives + copy review)

1. Primary CTA opens Claims showcase or (later) Enterprise package — never Contoso GUID under Claims words.  
2. One-sentence / headline uses scenario name only — no Contoso/Northwind.  
3. Disclosure says **illustrative sample** (or equivalent), not “live customer preview.”  
4. Product Tour / self-demo links are Contoso-labeled and secondary.  
5. Screenshot / video filenames and captions match the package actually on screen (**M-108**).

---

## Related

- [`DEMO_PREVIEW.md`](../library/DEMO_PREVIEW.md) — **M-133** Option D owner note  
- [`SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md`](SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md) — surface → package IDs (**M-134**/**M-107**)  
- [`COPY_TERMINOLOGY_AUDIT.md`](../ux-audits/COPY_TERMINOLOGY_AUDIT.md) — UI vocabulary  
- [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) — do-not-promise row  
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — **M-135** · **M-137** · **M-108**
