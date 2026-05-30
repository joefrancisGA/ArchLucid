> **Scope:** Owner-ratified rule for how ArchLucid presents documentation to product users vs engineering contributors.  
> **Decision date:** 2026-05-27 (documented 2026-05-30). **Owner:** product owner.  
> **Audience:** engineers, AI coding agents, designers, and GTM authors working on operator UI, marketing surfaces, and help links.  
> **V1 requirement:** customer-facing documentation must not use raw GitHub repository browsing as the default experience.

# Product documentation presentation standard

ArchLucid is an enterprise governance product for regulated architecture review. Documentation links from the product must reinforce a **polished, curated help experience** — not the mental model that the buyer is browsing an engineering repository.

**GitHub remains the engineering source of truth.** It must not be the **product documentation UI** for buyers, pilot users, or product operators.

---

## Problem statement

When a help link from ArchLucid opens a GitHub `blob` page, the user leaves the product and sees:

- Branch names, commit messages, PR counts, and security alert badges
- Raw/edit/blame/history controls and the full repo file tree
- Internal document filenames and engineering folder taxonomy
- Redirect stubs such as **Moved — pilot guide** with only a few lines pointing elsewhere

That experience is unacceptable for regulated enterprise buyers and evaluators. It signals an engineering-phase product, breaks brand immersion, and exposes internal taxonomy that should not appear in a customer help path.

---

## Audience routing (normative)

| Audience | Default destination | GitHub source link |
|----------|---------------------|--------------------|
| Buyer / pilot user / product operator | **In-app documentation** (`/help/{topic}`) | **No** — not in primary UI |
| Developer / contributor / internal engineer | GitHub docs (repo paths, ADRs, runbooks) | Yes — primary |
| Support / admin diagnostics | In-app support/help with optional source link | Optional footer only |
| Public marketing visitor | Public marketing pages or curated help | Optional “source” in technical appendix only |

**Rule:** Markdown may still be authored in-repo. Product users must see it **rendered inside ArchLucid** with product shell, typography, navigation, and search — not GitHub chrome.

---

## What in-app documentation must provide

Customer-facing doc pages must include:

- ArchLucid operator or marketing shell (not a new tab to github.com)
- Product typography, spacing, and navigation consistent with [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md)
- Clean topic navigation and search
- Role-aware sections where applicable
- Stable product terminology (see below)

Customer-facing doc pages must **not** expose:

- GitHub branch names, commit history, or file tree
- Raw / edit / blame / download controls
- PR or security alert counts
- Internal repository filenames as the primary navigation model
- Redirect stub pages (resolve canonical targets internally)

---

## Canonical in-app routes (target)

Product help links should resolve to stable in-app slugs. Initial V1 registry:

| Topic slug | In-app route | Buyer-facing title (example) |
|------------|--------------|------------------------------|
| `pilot-guide` | `/help/pilot-guide` | Pilot guide |
| `getting-started` | `/help/getting-started` | Getting started |
| `evidence-intake` | `/help/evidence-intake` | Evidence intake |
| `review-packages` | `/help/review-packages` | Review packages |
| `executive-summary` | `/help/executive-summary` | Executive summary |
| `evidence-trail` | `/help/evidence-trail` | Evidence trail |
| `governance-approval` | `/help/governance-approval` | Governance approval |
| `audit-trail` | `/help/audit-trail` | Audit trail |
| `troubleshooting` | `/help/troubleshooting` | Troubleshooting |

Example preferred experience for pilot onboarding:

```text
/help/pilot-guide
```

**Not:**

```text
https://github.com/.../docs/library/PILOT_GUIDE.md
```

The page should open with a product title and summary, for example:

> **Pilot guide**  
> Learn how to create your first architecture review package, attach evidence, review findings, finalize the signed decision record, and export audit-ready evidence.

An optional footer **View source documentation** link may appear only in **admin/developer/diagnostics** mode — never as the primary CTA for buyers or operators.

---

## Documentation registry

Implement a small **documentation registry** (code + generated manifest) that maps:

- **Product topic id** (stable slug)
- **Canonical in-app route**
- **Source markdown path(s)** in the repo (may be multiple for merged topics)
- **Audience** (`operator`, `buyer`, `marketing`, `developer`)
- **Redirect resolution** — if a source file is a compatibility stub, the registry must point at the **final** canonical markdown body, never the stub

**Banned customer-facing link targets:**

- Compatibility stubs whose primary content is “Moved — …” or “redirect”
- `docs/library/PILOT_GUIDE.md` (stub → resolve to [`customer-facing/PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md) and/or [`CORE_PILOT.md`](../CORE_PILOT.md) content in-app)

---

## Product terminology (customer-facing docs)

Customer-facing documentation must use stable product language aligned with [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md) and [`GLOSSARY.md`](GLOSSARY.md):

| Use | Avoid in buyer/operator help |
|-----|------------------------------|
| Review package | Run, job, task (as the primary noun) |
| Finding | Issue, alert (unless describing alerts) |
| Residual risk | Open issue |
| Evidence trail | Logs, output |
| Signed decision record | Decision, result |
| Governance approval | Sign-off |
| Audit trail | History (when meaning immutable audit log) |

---

## Current gaps (2026-05-30)

These surfaces still route product users to GitHub blob URLs and are in scope for backlog remediation:

| Surface | Location | Issue |
|---------|----------|-------|
| Help panel “Open documentation” | `archlucid-ui/src/components/HelpPanel.tsx` via `getDocHref()` | External GitHub when `NEXT_PUBLIC_DOCS_BASE_URL` unset |
| Contextual help “Learn more” | `archlucid-ui/src/lib/contextual-help-content.ts` → `toDocsBlobUrl()` | Same |
| Help documentation index tab | `archlucid-ui/public/doc-index.json` | Entries use GitHub blob URLs |
| Hard-coded GitHub links | Marketing, integrations, wizard, trust content modules | Bypass registry entirely |

Partial in-app infrastructure exists (`/help`, `HelpProductGuide`, `HelpDocsClient`, `/help/{topic}` markdown renderer, and `product-documentation-registry.ts`) but some contextual help links and `doc-index.json` entries still use GitHub blob URLs.

---

## Implementation requirements (for engineering)

When replacing customer-facing documentation links:

1. Route product help links to **ArchLucid-rendered** documentation pages, not raw GitHub repository pages.
2. Render Markdown inside the app shell using product typography, spacing, navigation, and search.
3. Do not expose GitHub branch names, commit history, file tree, raw/edit/blame controls, PR/security counts, or internal repository structure to product users.
4. **Never link redirect stub pages** from product UI; resolve canonical targets in the registry.
5. Keep optional **View source on GitHub** links only in developer/admin/diagnostics mode.
6. Maintain the documentation registry as the single map from product topics to canonical routes and source files.
7. Add CI or lint drift guards so new customer-facing GitHub blob links cannot regress into operator or marketing UI code paths.

---

## Cross-references

- Backlog: [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-143 – TB-148**
- UI aesthetic + language: [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md)
- V1 scope: [`V1_SCOPE.md`](V1_SCOPE.md)
- Operator help shell: `archlucid-ui/src/app/(operator)/help/`
- Help topic index (today): `archlucid-ui/src/lib/help-topics.ts`
- Canonical vocabulary: [`GLOSSARY.md`](GLOSSARY.md), [`CONCEPT_VOCABULARY.md`](CONCEPT_VOCABULARY.md)
