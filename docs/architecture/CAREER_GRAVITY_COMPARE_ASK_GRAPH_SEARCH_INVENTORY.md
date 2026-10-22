> **Scope:** Shrink-only inventory — Compare deltas, Ask answers, Graph nodes, and Search hits that omit execution-mode / door on Working Career. **Do not rewrite presenters here.** CG-056–059 own mutations.

> **Spine:** ADR **0091** · ADR **0079** · CG-007 · CG-008

# Career-gravity Compare, Ask, Graph, Search output inventory

**Last reviewed:** 2026-09-11

These are the all-day verbs (`ask`, `compare`, `graph`, `search`). Unlabeled Simulator Q&A is a livelihood lie.

Depends on [`CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md`](CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY.md). Nested mounts reuse these presenters.

## Result header honesty

| Verb | Presenter | Result header shows Real / Simulator / Rehearsal? | Leak class | Owner |
|------|-----------|------------------------------------------------------|------------|-------|
| Ask | `AskPageContent` / `AskReviewScopeStrip` | Scope is run id / signed record. **No** Mode or door line on the answer header | **bypass** | CG-056 |
| Compare | `CompareForm` | Deltas/summary. **No** Mode/door on the comparison header | **bypass** | CG-057 |
| Graph | `insights/evidence-graph/page.tsx` + nested graph client | Nodes/edges. **No** rehearsal band on the graph chrome | **bypass** | CG-058 |
| Search | `insights/search-review-evidence/page.tsx` | Hits. **No** Mode/door on hit rows | **bypass** | CG-059 |

None of these four Working presenters import `useEffectiveWorkingCareerRehearsalDoor`.

## Surfaces

| Path | Verb | Header honesty | Leak class | Owner |
|------|------|----------------|------------|-------|
| `archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx` | Ask | No Mode/door | **bypass** | CG-056 |
| `archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskReviewScopeStrip.tsx` | Ask | Run/record links only | **bypass** | CG-056 |
| `archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx` | Compare | No Mode/door | **bypass** | CG-057 |
| `archlucid-ui/src/app/(operator)/insights/evidence-graph/page.tsx` | Graph | No Mode/door | **bypass** | CG-058 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient.tsx` | Graph | Nested wrap of peer | **bypass** | CG-058 |
| `archlucid-ui/src/app/(operator)/insights/search-review-evidence/page.tsx` | Search | No Mode/door | **bypass** | CG-059 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx` | Ask | Nested wrap | **bypass** | CG-056 |
| `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient.tsx` | Compare | Nested wrap | **bypass** | CG-057 |

## Quoteable gaps

1. Four verbs: **none** stamp Rehearsal on the result header today.
2. Nested Ask/Compare/Graph inherit that unlabeled header.
3. Search has no nested page; peer Search is the Working verb.

## Shrink rules

1. **Do not rewrite presenters** from this inventory.
2. Ratchet: `career-gravity-compare-ask-graph-search-inventory.test.ts`.

## Intentional — do not “fix” from this inventory

- Desktop review **More** menu.
- Host Mode flip.
- Guided peer Insights aliases (keep for eval).
