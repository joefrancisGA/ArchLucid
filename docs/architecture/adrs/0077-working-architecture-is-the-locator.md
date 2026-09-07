> **Scope:** ADR 0077 — Working architecture identity is the canonical locator; review is a nested job.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0077: Working architecture is the locator; review is a nested job

- **Status:** Proposed
- **Date:** 2026-09-07

## Context

ADR 0074 (Accepted) productized a customer-visible **architecture identity** (`dbo.Architectures`) as the named parent object for the Working seat. Drafts (`DraftRequests`) and reviews (`Runs`/`Reviews`) remain separate children (ADR 0068). ADR 0069 (Accepted) gave Working one resumable start through `resolveWorkingStartHref`. ADR 0072 (Accepted) made the **review URL** canonical after spawn so spawn-locked drafts would not remain a second live editor.

That combination still trains repeat professionals to live in a **pipeline execution URL** (`/architecture/reviews/{reviewId}`) as Monday morning. Livelihoods attach to the **system they own** across days — a named architecture reopened from portfolio, recents, and Start — not to the last run id in the address bar.

**Rejected alternatives:**

- **Option L:** Merge `DraftRequests` and `Runs` — violates ADR 0068, spawn lock, and sealed-record immutability (ADR 0039).
- **Keep peer review URL as Working Start / Alt+N target** — preserves ADR 0072 review-as-home after spawn; fails the livelihood locator test.
- **Cosmetic rename of Reviews hub** — does not nest governed jobs under the parent identity.
- **Per-architecture ACL** — out of scope (ADR 0037 workspace boundary unchanged).

**Related (not rewritten):** ADR 0068, ADR 0069, ADR 0072, ADR 0074, ADR 0067 (Guided only). This ADR **supersedes for Working only** ADR 0069 clause 4 (in-flight review first on Start) and ADR 0072 decision 2 (review URL canonical after spawn as the **primary locator**). Spawn lock and read-only handoff intent from 0072 remain; only the **Working address bar** changes.

## Decision

1. **Working canonical locator** is `/architecture/architectures/{architectureId}` whenever a durable architecture identity exists — including while a review is in flight, spawn-locked, or sealed. The desk is the object the architect reopens; reviews are jobs **of** that object.
2. **Nested job URLs on Working:**
   - Review job: `/architecture/architectures/{architectureId}/reviews/{reviewId}` (+ existing child segments: findings, print, provenance).
   - Draft job: `/architecture/architectures/{architectureId}/drafts/{draftId}` (AO-05; identity desk `?draft=` remains supported).
3. **`resolveWorkingStartHref`** returns `architectureIdentityPath` when `lastOpenArchitectureId` or an in-flight operation's parent architecture id is known. It must **not** return `reviewDetailPath` as the Working Start / Alt+N / last-open href. In-flight and spawn-locked states surface as **chips on the architecture desk**, not as exile to a peer review URL.
4. **Peer `/architecture/reviews/{reviewId}`** remains a **legacy alias** on Working when `ArchitectureId` is known — server redirect to the nested path (query preserved). Unlinked legacy reviews (null `ArchitectureId`) stay on the peer URL with honesty; Guided / demo / trial may keep peer URLs (ADR 0067).
5. **`/architecture/reviews`** on Working is a **cross-architecture inbox**, not Monday morning. Portfolio and architecture desk are primary.
6. **Persistence unchanged:** ADR 0068 two tables; sealed records immutable (ADR 0039). No per-architecture ACL.

### Working route taxonomy

| Role | Path |
|------|------|
| Portfolio | `/architecture/architectures` |
| Desk (locator) | `/architecture/architectures/{architectureId}` |
| Draft job | `/architecture/architectures/{architectureId}/drafts/{draftId}` |
| Review job | `/architecture/architectures/{architectureId}/reviews/{reviewId}` |
| Inbox (secondary) | `/architecture/reviews` |

## Trade-offs

**Gains:** Monday-morning object matches architect mental model; bookmarks and Start train the named system, not the pipeline; nested URLs preserve ADR 0072 spawn-lock honesty without making the review URL the only instrument; portfolio scan and desk chrome stay coherent with ADR 0074.

**Sacrifices:** Dual URL period while redirects and call sites migrate; engineers must pass `ArchitectureId` into review links on Working; longer canonical URLs; server redirect work for legacy bookmarks; Guided must remain on peer URLs for teaching flows.

**Rejected:** Merging kernels/tables; making review URL optional when architecture exists; hiding review workspace tabs behind overflow (desktop strip stays full per product direction).

## Constraints

- Do not rewrite ADR 0068, 0069, 0072, or 0074 bodies — supersede Working locator clauses here only.
- `DraftRequests` and `Runs`/`Reviews` remain separate tables.
- Tenant isolation on every query (ADR 0037); 404/empty on out-of-scope ids.
- Desktop review workspace tabs stay a full strip (no **More** overflow).
- TB-645 vocabulary: architecture, review, finding, sealed review record.
- No 40th coverage engine. No per-architecture ACL, live presence, or finding-comment chat.
- No GTM cohort programs (M-90, M-44, M-91, M-92). No reopen TB-135 / TB-136.

## Expected impact

**System:** New nested App Router segments under `architectures/[architectureId]/reviews/[reviewId]`; `architectureNestedReviewPath` / `architectureNestedDraftPath` helpers; `resolveWorkingStartHref` and Working call sites stop minting peer review URLs; legacy peer review routes redirect on Working when `ArchitectureId` is known.

**Security:** Unchanged trust boundary — workspace-scoped RBAC; redirect targets remain tenant-scoped; mismatch between route `architectureId` and run `architectureId` → 404, not cross-architecture render.

**Operations:** No SQL migration for this ADR; Vitest guards prevent `resolveWorkingStartHref` regressions; optional nav matrix drift guard (AO-47).

**Cost:** Negligible — URL builders and redirects only; no new infra.

**Teams:** Engineering implements AO-02–50 in sequence; Guided eval flows unchanged; GTM unchanged.

## Consequences

- **Positive:** Working seat reads as an all-day architecture desk; sealed records stay honest children; Slack/email/CI links converge on nested paths via redirect.
- **Negative:** Short-term grep churn across Working components; reviewers must refuse “just use reviewDetailPath for Start” shortcuts.
- **Follow-ups:** AO-04–50 (nested routes, desk chrome, tool binding, CI acceptance guard).
