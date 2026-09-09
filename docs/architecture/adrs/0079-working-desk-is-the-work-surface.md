> **Scope:** ADR 0079 — Working architecture desk is the work surface; Insights tools nest on the identity.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0079: Working architecture desk is the work surface

- **Status:** Accepted
- **Date:** 2026-09-07
- **Implemented:** 2026-09-07 (SY-01–SY-100; SY-80 / SY-100 close audit)

## Context

ADR 0077 (Accepted) made the **architecture identity** the Working locator: Start, last-open, and nested review/draft job URLs train the named system as Monday morning. Wave 17 (AO-01–50) also **rebound** Ask, Compare, and Graph by appending `runId` / `architectureId` query params on **peer** `/insights/*` routes.

That bind-by-query shape keeps Insights as **sibling products** the architect leaves the desk to open. Muscle memory still teaches a pipeline: Alt+R opens `/architecture/reviews`, Alt+A opens `/insights/ask-review-questions`, and many call sites mint `reviewDetailPath` when `ArchitectureId` is known. The paying seat still **does the day’s work in other apps**, not on the system they own.

**Rejected alternatives:**

- **Keep peer Insights forever with query bind only** — preserves AO-30–32 honesty but fails the livelihood “system not job” test; reviewers cannot refuse a new Working peer Insights page.
- **Merge DraftRequests and Runs** — violates ADR 0068 and sealed-record immutability.
- **Collapse review-detail workspace tabs behind More** — rejected by product direction; desk command bar and nested tool routes are not that menu.
- **Per-architecture ACL or live presence** — out of scope (ADR 0037 workspace boundary unchanged).

**Related (not rewritten):** ADR 0068, 0069, 0072, 0074, 0077. This ADR **supersedes for Working only** AO-30–32 *product URL shape* (bind-by-query on peer `/insights/*`). Guided / demo / trial may keep peer Insights and peer review URLs (ADR 0067).

## Decision

1. **Working canonical work surface** is the architecture identity desk (`/architecture/architectures/{architectureId}`) plus **nested tools** on that identity:
   - Ask: `/architecture/architectures/{architectureId}/ask`
   - Compare: `/architecture/architectures/{architectureId}/compare`
   - Graph: `/architecture/architectures/{architectureId}/graph`
   - Search: `/architecture/architectures/{architectureId}/search`
   - Findings: `/architecture/architectures/{architectureId}/findings`
2. **Peer `/insights/*` and bare `/architecture/reviews/{reviewId}`** remain **Guided/legacy aliases** on Working. When `ArchitectureId` is known, Working **redirects** to the nested path (query preserved where honest). Unlinked legacy reviews stay on peer URLs with honesty.
3. **`/architecture/reviews`** is a **cross-architecture inbox**, never Monday morning, and **must not** own Alt+R. Portfolio (`/architecture/architectures`) and the open architecture desk are primary.
4. **Keyboard atlas on Working:** Alt+R opens last-open architecture desk or portfolio — never the reviews hub. Alt+C / Alt+A / Alt+Y / Alt+G resolve to nested tools under the open architecture when known.
5. **Persistence unchanged:** ADR 0068 two tables; sealed records immutable (ADR 0039). No per-architecture ACL.

### Working desk taxonomy (extends ADR 0077)

| Role | Path |
|------|------|
| Portfolio | `/architecture/architectures` |
| Desk (work surface) | `/architecture/architectures/{architectureId}` |
| Nested Ask | `/architecture/architectures/{architectureId}/ask` |
| Nested Compare | `/architecture/architectures/{architectureId}/compare` |
| Nested Graph | `/architecture/architectures/{architectureId}/graph` |
| Nested Search | `/architecture/architectures/{architectureId}/search` |
| Nested Findings | `/architecture/architectures/{architectureId}/findings` |
| Review job | `/architecture/architectures/{architectureId}/reviews/{reviewId}` |
| Draft job | `/architecture/architectures/{architectureId}/drafts/{draftId}` |
| Inbox (secondary) | `/architecture/reviews` |

## Implementation / Evidence

Nested desk routes and Working keyboard atlas shipped; Decision above unchanged.

| Area | Evidence |
|------|----------|
| Acceptance guard | `archlucid-ui/src/lib/system-desk-acceptance-guard.test.ts` (Alt+R → desk not inbox; nested path helpers) |
| Close audit | `docs/architecture/SYSTEM_DESK_ACCEPTANCE_2026-09-07.md` |
| Wave index | `docs/architecture/SYSTEM_DESK_COMPOSER_PROMPTS.md` (SY-80 keyboard ratchet; SY-100 wave close) |

## Trade-offs

**Gains:** Monday-morning object is the **system** architects reopen all week; Ask/Compare/Graph read as **verbs on that desk**, not separate products; bookmarks, share, CLI, and keyboard train one identity; SY-80 ratchet can fail Alt+R → inbox regressions in CI.

**Sacrifices:** More App Router segments and redirect work; engineers must pass `architectureId` into tool links; dual URL period while peer bookmarks redirect; longer canonical URLs; Insights peer pages remain for Guided teaching.

**Rejected:** Deleting peer Insights routes; merging kernels; hiding review workspace tabs; inventing per-architecture ACL or chat.

## Constraints

- Do not rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only.
- `DraftRequests` and `Runs`/`Reviews` remain separate tables.
- Tenant isolation on every query (ADR 0037); nested route `architectureId` mismatch with run metadata → 404, not cross-architecture render.
- Desktop review workspace tabs stay a full strip (no **More** overflow).
- TB-645 vocabulary: architecture, review, finding, sealed review record.
- No 40th coverage engine. No live presence or finding-comment chat.
- No GTM cohort programs (M-90, M-44, M-91, M-92). No reopen TB-135 / TB-136.

## Expected impact

**System:** New nested segments under `architectures/[architectureId]/`; path helpers (`architectureNestedAskPath`, etc.); Working redirects from peer Insights; `resolveWorkingAltRHref` and shortcut listener remap Alt+R; mint sweep replaces `reviewDetailPath` when `ArchitectureId` is known.

**Security:** Unchanged trust boundary — workspace-scoped RBAC; nested tool routes 404 when architecture id is out of tenant scope or disagrees with run parent; redirects stay tenant-scoped.

**Operations:** No SQL migration for this ADR; Vitest guards (`system-desk-acceptance-guard.test.ts`) ratchet keyboard and import rules; optional route inventory (SY-97).

**Cost:** Negligible — URL builders, thin page wrappers reusing existing Insights clients, redirects only.

**Teams:** Engineering implements SY-01–100 in sequence; Guided eval flows unchanged; FC / density / what-if remain parallel waves.

## Consequences

- **Positive:** Working seat reads as an all-day architecture desk; Insights tools are desk verbs; inbox is deliberate, not Home.
- **Negative:** Short-term grep churn across Working components; reviewers must refuse new Working peer Insights pages as the daily tool.
- **Follow-ups:** SY-36–50 nested routes; SY-77–80 ratchet; SY-100 wave close audit.
