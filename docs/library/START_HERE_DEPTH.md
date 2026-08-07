> **Scope:** Contributor-reference — Extended onboarding narrative and tables formerly in `docs/START_HERE.md` — split 2026-04-27 so the root hub stays a ≤40-line routing tree. **Start at [../START_HERE.md](../START_HERE.md).**

# Start here — depth (buyer + contributor)

This file preserves the **audience split**, assumptions, constraints, architecture overview, data-flow steps, security model, operational notes, and **where the rest of the docs went** — unchanged in substance from the pre-2026-04-27 `START_HERE.md` body.

## Objective

Give **buyers, evaluators, sponsors, operators, and engineers** one place to understand **what to open first**, **how long each step takes**, and **where depth lives** without competing "first doc" hubs.

## Audience split (read this first)

ArchLucid is a **SaaS** product. Pick the column that matches you — they share **almost no documents**.

| You are… | What you ever touch | Start here | Never asked of you |
|---|---|---|---|
| **Buyer / evaluator / sponsor / customer** | The public site (`archlucid.net`), the in-product **architect workspace** after sign-in, and the **Azure portal** only for your own tenant identity / billing artefacts. | **[`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md)** (the canonical evaluator entry — five steps, no install) → **[`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** → **[`ARCHITECTURE_ON_ONE_PAGE.md`](../ARCHITECTURE_ON_ONE_PAGE.md)**. The same five steps with screenshots live at the marketing route `archlucid.net/get-started`. | **No Docker. No SQL. No .NET / Node SDKs. No Terraform. No CLI.** If any doc tells you to install one of those, you are reading a **contributor** doc by mistake. |
| **ArchLucid contributor / engineer / internal Admin** | The repo, your local toolchain (Docker / SQL container / .NET / Node), the GitHub workflows, and (Admin only) the production Azure subscription via OIDC. | **[`../START_HERE.md`](../START_HERE.md)** | None — this column is the one with the toolchain. |

**Which subtree is "mine" when browsing blindly?** [DOCUMENTATION_BY_AUDIENCE.md](DOCUMENTATION_BY_AUDIENCE.md) — heuristic map of **`docs/`** folders that skew customer-visible vs contributor/vendor-internal.

> **What about the buyer's first 30 minutes inside the product?** The buyer-facing equivalent of [`engineering/FIRST_30_MINUTES.md`](../engineering/FIRST_30_MINUTES.md) ships in two places: the repo stub at [`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md) (consultative scaffold, q35 placeholders on owner-blocked sentences) and the marketing route `archlucid.net/get-started` (same five steps with placeholder screenshot slots until owner names the real-tenant `tenantId` / `runId` for capture). The cloud trial funnel itself (`archlucid.net/signup → /demo/preview → first sample run`) is wired in code but **not yet live in production** — see Improvement 2 in [`QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](../archive/../assessments/LATEST_GPT55.md) §3 and [`runbooks/TRIAL_FUNNEL_END_TO_END.md`](../runbooks/TRIAL_FUNNEL_END_TO_END.md).

## Assumptions

- **Quick lookup:** [`architecture/README.md`](../architecture/README.md) and [`CONTRIBUTOR_CODE_MAP.md`](CONTRIBUTOR_CODE_MAP.md) — task → doc routing after first review.
- **Persona copy-paste recipes:** [customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md](customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md) — architect, governance, procurement/security, platform engineer.
- You self-identified above. The **buyer column never installs anything**; the **contributor column** uses the spine.
- Incomplete requirements and imperfect teams are normal — this layout keeps the **default path narrow** and pushes depth into [`docs/library/`](.) and topic folders.

## Constraints

- **Architectural decision records** stay under [`docs/architecture/adrs/`](../architecture/adrs/) (do not treat ADRs as onboarding fiction).
- **Historical receipts** stay under [`docs/archive/`](../archive/) — never silently rewritten.
- **SMB / port 445** never belongs on the public internet; storage stays on private endpoints (see [`contributor-reference/SECURITY.md`](contributor-reference/SECURITY.md) and [`docs/runbooks/TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md)).

## Architecture overview (where ArchLucid sits)

ArchLucid coordinates **architecture requests → authority pipeline → finalized architecture packages + artifacts + evidence**. The **C4-style poster** is **[`ARCHITECTURE_ON_ONE_PAGE.md`](../ARCHITECTURE_ON_ONE_PAGE.md)** — read it once you have run something (even a demo run).

```text
[Evaluator / Sponsor] --> START_HERE (hub)
       |
       v
[Contributor path] --> depth on demand --> docs/library + adr + runbooks
```

## Component breakdown

| Layer | You touch it when… |
|-------|---------------------|
| **Buyer / sponsor narrative** | You need procurement-safe language before touching the repo — **[`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** |
| **Contributor path** | You will implement, operate, or govern ArchLucid — see `START_HERE.md` |
| **Architect workspace wizard** | You want `/reviews/new` semantics without screenshots — design **[`CANONICAL_FIRST_RUN_PATH.md#first-run-wizard-architect-workspace`](CANONICAL_FIRST_RUN_PATH.md#first-run-wizard-architect-workspace)** (`FIRST_RUN_WIZARD.md` alias) + checklist **[`CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough`](CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough)** (`FIRST_RUN_WALKTHROUGH.md` alias) |
| **Deeper engineering index** | You already ran the spine and need maps — **[`architecture/README.md`](../architecture/README.md)** |
| **Everything else** | Search or browse **[`docs/library/`](.)** (~150+ reference markdown files moved 2026-04-23 to keep `/docs` root small) |

## Data flow — canonical **buyer / evaluator** journey (no install)

1. **Open the canonical first-30-minutes path** — **[`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md)** (5 min read; the same five steps render at `archlucid.net/get-started` with screenshots).
2. **Believe the problem is real** — read **[`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** (10–15 min).
3. **See the system shape** — skim **[`ARCHITECTURE_ON_ONE_PAGE.md`](../ARCHITECTURE_ON_ONE_PAGE.md)** (15 min; diagrams first; no install required, just look at the poster).
4. **Run something — in the cloud, not locally** — sign up at **`archlucid.net/signup`** (cloud trial; status see Improvement 2 in [`QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md`](../archive/../assessments/LATEST_GPT55.md)). Until that path is live, request a guided demo.
5. **Run a serious pilot** — read **[`CORE_PILOT.md`](../CORE_PILOT.md)** for the operator motion and review surfaces (you operate the in-product UI; ArchLucid hosts the stack).
6. **Track open decisions** — **[`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)** (owner gates, cadence reminders).

### Contributor / internal-engineer path

> **Audience.** ArchLucid contributors and internal engineers only. **Customers never read this.** It is the toolchain path for people building or operating ArchLucid itself.

Start at **[`../START_HERE.md`](../START_HERE.md)** and follow the contributor tree.

**Filename redirects:** See [`redirects.md`](../redirects.md) for former stub paths (`FIRST_5_DOCS`, `FIRST_FIVE_DOCS`, `FIRST_RUN_WIZARD`, `FIRST_RUN_WALKTHROUGH`, etc.). Spine detail stays in [`START_HERE.md`](../START_HERE.md).

## Security model (read once)

- **Authentication modes** and fail-closed defaults are summarized in **[`contributor-reference/SECURITY.md`](contributor-reference/SECURITY.md)**.
- **Tenant isolation** deep dive: [`security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).

## Operational considerations

- **Break / fix loop:** [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md).
- **Hosted stack order:** [`library/REFERENCE_SAAS_STACK_ORDER.md`](REFERENCE_SAAS_STACK_ORDER.md).
- **Change log (user-visible):** [`CHANGELOG.md`](../CHANGELOG.md) · **breaking-only:** [`../../BREAKING_CHANGES.md`](../../BREAKING_CHANGES.md).

## Where the rest of the docs went

On **2026-04-23** the repository **compressed `/docs` root** so evaluators see ~20 active entry files instead of ~200. Most former root markdown files now live under **[`docs/library/`](.)** with **relative links rewritten** across markdown. Superseded **quality / Cursor prompt packs** were deleted **2026-07-31**; the canonical old→new map is **[`redirects.md`](../redirects.md)**.

**Doc map:** For a maintained inventory and anchors, skim [`REPO_DIGEST.md`](REPO_DIGEST.md) (regenerate with `python scripts/repo_digest/build_repo_digest.py`). To emit a table of every `docs/**/*.md` path (excluding `docs/archive/`), run `python scripts/generate_doc_inventory.py` when needed.

## Related (optional depth)

- Historical onboarding write-ups: [`../onboarding/day-one-developer.md`](../onboarding/day-one-developer.md)
- Full archive index: [`archive/README.md`](../archive/README.md)
