> **Scope:** Canonical buyer + evaluator entry — Day-0 narrative, five-document spine, and where to go next without opening 200 root files.

# Start here — ArchLucid

## Objective

Give **evaluators, sponsors, operators, and engineers** one place to understand **what to open first**, **how long each step takes**, and **where depth lives** without competing “first doc” hubs.

## Assumptions

- You may be **non-technical** (Docker-only path) or **shipping code** (.NET / Node / Azure).
- Incomplete requirements and imperfect teams are normal — this layout keeps the **default path narrow** and pushes depth into [`docs/library/`](library/) and topic folders.

## Constraints

- **Architectural decision records** stay under [`docs/adr/`](adr/) (do not treat ADRs as onboarding fiction).
- **Historical receipts** stay under [`docs/archive/`](archive/) — never silently rewritten.
- **SMB / port 445** never belongs on the public internet; storage stays on private endpoints (see [`SECURITY.md`](../SECURITY.md) at repo root and [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md)).

## Architecture overview (where ArchLucid sits)

ArchLucid coordinates **architecture requests → authority pipeline → committed manifests + artifacts + evidence**. The **C4-style poster** is **[`ARCHITECTURE_ON_ONE_PAGE.md`](ARCHITECTURE_ON_ONE_PAGE.md)** — read it once you have run something (even a demo run).

```text
[Evaluator / Sponsor] --> START_HERE (this file)
       |
       v
[Five-document spine] --> depth on demand --> docs/library + adr + runbooks
```

## Component breakdown

| Layer | You touch it when… |
|-------|---------------------|
| **Buyer / sponsor narrative** | You need procurement-safe language before touching the repo — **[`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)** |
| **Five-document spine** | You will implement, operate, or govern ArchLucid — table below |
| **Operator UI wizard** | You want `/runs/new` semantics without screenshots — **[`library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md)** + checklist **[`library/FIRST_RUN_WALKTHROUGH.md`](library/FIRST_RUN_WALKTHROUGH.md)** |
| **Deeper engineering index** | You already ran the spine and need maps — **[`ARCHITECTURE_INDEX.md`](ARCHITECTURE_INDEX.md)** |
| **Everything else** | Search or browse **[`docs/library/`](library/)** (~150+ reference markdown files moved 2026-04-23 to keep `/docs` root small) |

## Data flow — canonical buyer journey

1. **Believe the problem is real** — read **[`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)** (10–15 min).
2. **See the system shape** — skim **[`ARCHITECTURE_ON_ONE_PAGE.md`](ARCHITECTURE_ON_ONE_PAGE.md)** (15 min; diagrams first).
3. **Run something** — follow **[`FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md)** (Docker-only) *or* `dotnet run --project ArchLucid.Cli -- try` when you have the .NET 10 SDK + Docker.
4. **Run a serious pilot** — **[`CORE_PILOT.md`](CORE_PILOT.md)** (operator motion, review surfaces).
5. **Track open decisions** — **[`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)** (owner gates, cadence reminders).

### Five-document spine (Day-1 reading order)

| # | Document | Role | Time |
|---|----------|------|------|
| 1 | **[`INSTALL_ORDER.md`](INSTALL_ORDER.md)** | Toolchain + install order | ~10 min |
| 2 | **[`FIRST_30_MINUTES.md`](FIRST_30_MINUTES.md)** | First committed manifest + finding (Docker) | ~30 min |
| 3 | **[`CORE_PILOT.md`](CORE_PILOT.md)** | First pilot / operator motion | ~20 min |
| 4 | **[`ARCHITECTURE_ON_ONE_PAGE.md`](ARCHITECTURE_ON_ONE_PAGE.md)** | Poster + ownership | ~15 min |
| 5 | **[`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)** | Owner decisions + gates | ~10 min |

**Filename redirects:** [`FIRST_5_DOCS.md`](FIRST_5_DOCS.md), [`FIRST_FIVE_DOCS.md`](FIRST_FIVE_DOCS.md), [`FIRST_RUN_WIZARD.md`](FIRST_RUN_WIZARD.md), [`FIRST_RUN_WALKTHROUGH.md`](FIRST_RUN_WALKTHROUGH.md) are **thin stubs** pointing here so bookmarks stay stable.

## Security model (read once)

- **Authentication modes** and fail-closed defaults are summarized in **[`library/SECURITY.md`](library/SECURITY.md)** and repo-root **[`SECURITY.md`](../SECURITY.md)**.
- **Tenant isolation / RLS** deep dive: [`security/MULTI_TENANT_RLS.md`](security/MULTI_TENANT_RLS.md).

## Operational considerations

- **Break / fix loop:** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).
- **Hosted stack order:** [`library/REFERENCE_SAAS_STACK_ORDER.md`](library/REFERENCE_SAAS_STACK_ORDER.md).
- **Change log (user-visible):** [`CHANGELOG.md`](CHANGELOG.md) · **breaking-only:** [`../BREAKING_CHANGES.md`](../BREAKING_CHANGES.md).

## Where the rest of the docs went

On **2026-04-23** the repository **compressed `/docs` root** so evaluators see ~20 active entry files instead of ~200. Most former root markdown files now live under **[`docs/library/`](library/)** with **relative links rewritten** across markdown. Superseded **quality / Cursor prompt packs** (except the current **68.60** pair) moved under **[`archive/quality/2026-04-23-doc-depth-reorg/`](archive/quality/2026-04-23-doc-depth-reorg/)**.

**Inventory:** [`DOC_INVENTORY_2026_04_23.md`](DOC_INVENTORY_2026_04_23.md) lists every active markdown file (excluding `docs/archive/`) with last-modified metadata and audience tags.

## Related (optional depth)

- Historical onboarding write-ups: [`archive/ONBOARDING_START_HERE_2026_04_17.md`](archive/ONBOARDING_START_HERE_2026_04_17.md)
- Full archive index: [`archive/README.md`](archive/README.md)
