> **Scope:** Copy-paste Composer prompts that productize **named, listable Architecture** as the customer object. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/customer-architecture-00-index.md`](../../.cursor/prompts/customer-architecture-00-index.md) (**CA-01–50**)
> **Wave 13 skeleton:** [`DURABLE_ARCHITECTURE_COMPOSER_PROMPTS.md`](DURABLE_ARCHITECTURE_COMPOSER_PROMPTS.md) (**DA-01–12**) — **do not paste DA after this set exists**
> **Wave 12:** [`LIVELIHOOD_KERNEL_COMPOSER_PROMPTS.md`](LIVELIHOOD_KERNEL_COMPOSER_PROMPTS.md) (**LK-01–15**)

# Customer-architecture Composer prompts (CA-01–CA-50)

**Created:** 2026-09-05 · **Status:** ready to run · **Do not re-run** LI, LD, RS, WA, CD, AD, FD, IS, LS, SD, CR, LK, or **DA-01–12** except as a CA row says “skip if that DA file already shipped.” **Do not paste LK-05–07 / IS-15.**

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. The remaining livelihood failure is the **unit of work**. Persistence already has `dbo.Architectures`. The paying desk still treats **draft rows** as architectures (`architectureId` = `DraftId`) and **reviews** as the Monday-morning object.

Wave 13 (**DA-01–12**) named the bet and bundled schema, API, desk, rename, inventory, and backfill into twelve sessions. That is not enough surface area to land a customer object without mixing HTTP, routes, nav, CLI, and honesty in one paste. **This set supersedes DA for execution** and splits the work into fifty paste-one-file sessions.

Paste **one** `.cursor/prompts/customer-architecture-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Casual tools optimize a wizard, a demo compare, and a paged list of the last twenty runs.

Livelihood tools optimize a **named architecture** you reopen all week, **drafts and reviews as children**, **inventory that cannot silently omit row 21**, and eval chrome that **stays off the paying desk**.

## Diagnosis → prompt (summary)

| Class | Prompts | Residual after DA skeleton |
|-------|---------|----------------------------|
| Contract | **CA-01** | ADR 0074 (same bet as DA-01; skip if 0074 exists) |
| Schema | **CA-02–06** | Split DA-02: name, FK, repositories, computed pointers, DDL tests |
| HTTP | **CA-07–13** | Split DA-03: list, get, ensure, PATCH, controller, OpenAPI |
| Lifecycle | **CA-14–19** | Split DA-06 / DA-12: first save, name, spawn, legacy, backfill, honesty |
| Routing honesty | **CA-20–24** | Split DA-05: route split, redirect, rename hooks, new-draft flow |
| Monday desk | **CA-25–38** | Split DA-04: hub, desk, children, compare, nav, start, palette, Guided |
| Career inventory | **CA-39–41** | DA-07 / DA-08 / DA-11 leftovers |
| Instrument edges | **CA-42–48** | Search, CLI, help, recurrence, in-flight, eval leakage, vocabulary |
| Portfolio + audit | **CA-49–50** | Soft-archive; residual grep |

## Sequencing

See [`.cursor/prompts/customer-architecture-00-index.md`](../../.cursor/prompts/customer-architecture-00-index.md). **ADR → schema → API → ensure/backfill → routes → desk → inventory → edges.**

## Intentional — do not “fix”

- Desktop review tabs stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s (ADR 0071 document stack stays on drafts).
- ADR 0068 two kernels and two SQL tables stay. **Do not merge** `DraftRequests` and `Runs`.
- Sealed records stay immutable.
- Guided / demo / trial remain eval sessions.
- BFF session stays LK-05–07.
- Draft conflict recovery stays LK-12 (keep local or reload — no merge engine).
- No live presence / finding-comment chat — collaboration is the shared identity + review history.
- No 40th coverage engine.
- No per-architecture ACL in V1 — workspace scope (ADR 0037).

## Do not re-run

- **DA-01–12** — wave 13 skeleton; this set owns execution
- **LK-01–15** — **Do not paste LK-05–07**
- **IS / LS / SD / CR / FD / AD / CD / WA / RS / LD / LI / PT / WD / DD**
