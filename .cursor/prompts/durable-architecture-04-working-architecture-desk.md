# DA-04 — Working architecture desk

**Do not fork IS-02** (Working Home one primary). **Do not fork IS-03** (`resolveWorkingStartHref`). **Do not collapse review tabs.** This is the **Monday-morning surface** of ADR 0074. DA-03 list/get must exist (or this PR includes them).

## Goal

On an authenticated **Working** seat, the durable object you reopen is an **architecture identity**.

Ship a desk (extend `/architecture/architectures/{architectureId}` **when that segment is the identity id**, or add `/architecture/systems/{architectureId}` if DA-05 has not yet split draft vs identity routes — prefer **one identity route** and keep draft editor as a child: query `?draft=` or `/…/{architectureId}/draft/{draftId}`).

The desk shows, in Carbon density:

1. Display name + last updated.
2. Current unsealed draft (or “no open draft” + **New version** / clone-from-snapshot if WA-10 exists).
3. Child **reviews** table (not a second product chooser): status, sealed or in-flight, href to review detail (ADR 0072 still owns the review URL).
4. Latest sealed record link when `LatestSealedManifestId` is set.
5. Compare entry that **pre-fills both sides from this architecture’s reviews** (still two reviews — do not build N-way). Hide `CompareDemoQuickPick` on this desk (DA-09 owns the global Working compare page).

Guided may keep the drafts list as the inventory. Working must not present the drafts list as the architecture portfolio.

## Why

ADR 0069 made start **one primary**. The rest of the week still dumps the architect into Reviews or a draft form. Collaboration without chat is **shared history on one identity**. That is the livelihood primitive: two people can name the same system and see every sealed record against it.

## Context

- ADR 0074, DA-03 DTOs
- `archlucid-ui/src/app/(operator)/architecture/architectures/`
- `ArchitectureDraftWorkspace.tsx` — today this **is** the page at `{architectureId}` where id is a draft id
- `working-start-route.ts`, `resolveContinueLastReviewPackage.ts`
- `FavoriteReviewsList.tsx` / `operator-recent-views.ts` — browser-local; desk should prefer **server identity list**, not new localStorage
- `compare-workspace-copy.ts`
- `UI_DESIGN_SYSTEM.md` compact spacing; `EnterpriseTable`

## What to build

1. Working identity desk page + copy module (sentence case).
2. Wire list: Working sidebar/hub that currently lists drafts as architectures now lists identities (or a clearly named **Drafts** secondary). Do not add a competing primary CTA on Home (IS-02).
3. Palette command “Open architecture” uses identity ids, not draft ids.
4. Vitest: Working fixture shows reviews for this `ArchitectureId` only; Guided fixture may still show draft inventory labels.
5. Continue-last: prefer last-open **architecture** then in-flight review (do not fork IS-03 resolver unless a one-line call is required — then keep in-flight-review first).

## Acceptance criteria

- A Working user with two reviews of one system sees **one** architecture row and two child reviews.
- Opening the architecture does not look like “Start review” wizard chrome.
- Desktop review tabs on the child review are unchanged.

## Constraints

- No live presence, no comment threads.
- No `max-w-prose` marketing column as the desk.
- TB-2005 if any rename form is added (disable until name non-empty).
