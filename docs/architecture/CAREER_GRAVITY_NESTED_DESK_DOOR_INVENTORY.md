> **Scope:** Shrink-only inventory — Ask / Compare / Graph / Search / Findings nested under the architecture identity vs peer `/insights/*`. **Do not rewrite nested presenters here.** CG-056–060 own mutations.

> **Spine:** ADR **0091** · ADR **0079** · SY nested tools · AS-077 · CG-007

# Career-gravity nested desk door inventory

**Last reviewed:** 2026-09-11

If Ask answers from a Simulator run without Rehearsal labeling, the desk launders rehearsal. Nested routes inherit **architecture identity**, not automatically the Career/Rehearsal door.

Door source today: `useEffectiveWorkingCareerRehearsalDoor` → `localStorage` (until CG-011). Nested tool clients **do not** call that hook.

## Nested vs peer

| Tool | Nested path helper | Nested page | Peer Insights alias (Guided; do not rewrite) | Door read on nested client? |
|------|--------------------|-------------|---------------------------------------------|------------------------------|
| Ask | `architectureNestedAskPath` | `…/architectures/[architectureId]/ask/page.tsx` | `/insights/ask-review-questions` | **No** — wraps `AskPageContent` |
| Compare | `architectureNestedComparePath` | `…/compare/page.tsx` | `/insights/compare-two-reviews` | **No** — wraps `CompareForm` |
| Graph | `architectureNestedGraphPath` | `…/graph/page.tsx` | `/insights/evidence-graph` | **No** |
| Findings | `architectureNestedFindingsPath` | `…/findings/page.tsx` | Findings hub / review tab | **No** |
| Search | `architectureNestedSearchPath` | **No nested page** | `/insights/search-review-evidence` | Helper only — peer remains the Working search surface |

Working peer Ask redirects to nested when architecture is known (`resolveWorkingPeerAskRedirectHref`). Guided may keep peer URLs.

## Surfaces

| Path | Door read? | Unlabeled output | Leak class | Owner |
|------|------------|------------------|------------|-------|
| `archlucid-ui/src/lib/architecture/architecture-routes.ts` | Helpers only | N/A | covered (routing) | CG-007 |
| `archlucid-ui/src/hooks/use-effective-working-career-rehearsal-door.ts` | **Yes** (chooser consumers) | Not mounted on nested tools | mismatch | CG-011 / CG-056 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx` | **No** | Peer Ask answers | **bypass** | CG-056 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient.tsx` | **No** | Peer Compare deltas | **bypass** | CG-057 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient.tsx` | **No** | Peer graph | **bypass** | CG-058 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient.tsx` | **No** | Findings list | **bypass** | CG-060 |
| `archlucid-ui/src/lib/resolve-working-peer-ask-redirect-href.ts` | Redirect only | Does not stamp door | related | CG-056 |
| `archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx` | **No** | Peer / Guided Ask | **bypass** / eval-ok on Guided | CG-056 |
| `archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx` | **No** | Peer Compare | **bypass** | CG-057 |
| `archlucid-ui/src/app/(operator)/insights/evidence-graph/page.tsx` | **No** | Peer Graph | **bypass** | CG-058 |
| `archlucid-ui/src/app/(operator)/insights/search-review-evidence/page.tsx` | **No** | Peer Search (no nested page) | **bypass** | CG-059 |

## Quoteable gaps

1. Nested clients remount peer presenters. Architecture nesting ≠ door inheritance.
2. `architectureNestedSearchPath` has **no** `page.tsx`. Working Search stays on `/insights/search-review-evidence`.
3. Do not rewrite Guided peer aliases from this inventory.

## Shrink rules

1. **Do not rewrite presenters** (CG-056–060).
2. Ratchet: `career-gravity-nested-desk-door-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Merging DraftRequests and Runs.
- Host Mode flip.
