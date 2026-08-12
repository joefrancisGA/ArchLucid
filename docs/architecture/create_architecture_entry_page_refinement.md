# Create architecture entry page refinement (RC12)

**Date:** 2026-07-19  
**Route:** `/architectures/new`  
**Scope:** Entry-page UX only — no review-engine, generation, or global-nav changes.

## Exact route and components

| Layer | Path |
|-------|------|
| Route page | `archlucid-ui/src/app/(operator)/architectures/new/page.tsx` |
| Bootstrap UI | `archlucid-ui/src/components/architecture/ArchitectureCreationBootstrap.tsx` |
| Draft title helpers | `archlucid-ui/src/lib/architecture/architecture-draft-status.ts` |
| Registry list sanitization | `archlucid-ui/src/lib/architecture/architecture-draft-registry.ts` |
| Labels | `archlucid-ui/src/lib/architecture/architecture-workflow-labels.ts` |
| Entry copy | `archlucid-ui/src/lib/create-vs-review-intake-copy.ts` |

## Breadcrumb correction

**Already correct before this change.**  
`breadcrumb-map.ts` special-cases `ARCHITECTURES_NEW_PATH` to:

`Architectures` → `Create architecture`

using `ARCHITECTURE_DRAFTS_LIST_LABEL` and `CREATE_ARCHITECTURE_LABEL`. No breadcrumb edit was required. Existing `breadcrumb-map.test.ts` coverage remains the guard.

Page title, `metadata.title`, and nav label already used `CREATE_ARCHITECTURE_LABEL`.

## Source of the leaked bootstrap identifier

Internal placeholder intent is defined in `architecture-creation-bootstrap.ts`:

`[archlucid:architecture-draft-bootstrap] …`

It is written on draft create by `architecture-creation-init.ts` to satisfy server minimum-intent length. The form layer already clears it via `applyArchitectureCreationDraftToFormState`, but **registry display names** called `architectureDraftDisplayName(systemName, freeTextIntent)` which treated bootstrap intent as a normal title (often truncated to 64 chars). That leaked into `/architectures/new` resume links and any other registry consumer.

### Fix layer

1. `architectureDraftDisplayName` — treat bootstrap intent as untitled (`Untitled architecture`).
2. `customerFacingArchitectureDraftTitle` — sanitize stored registry titles that still contain the marker.
3. `listArchitectureDraftRegistryEntries` — apply sanitization on read so historical local registry rows never render the marker.

No destructive rewrite of server draft rows.

## Draft-title fallback behavior

| Input | Customer-facing title |
|-------|------------------------|
| Non-empty `systemName` | System name |
| Bootstrap placeholder intent | `Untitled architecture` |
| Meaningful free-text intent | Intent (truncate >64 with ellipsis) |
| Empty / whitespace | `Untitled architecture` |
| Stored registry title with bootstrap marker | `Untitled architecture` |

## Loading-state correction

- Initial mode is an intentional skeleton (`architecture-creation-bootstrap-loading`) with `aria-busy`.
- Ready content replaces the skeleton completely (`architecture-creation-bootstrap-ready`).
- Create pending uses a dedicated creating state (`architecture-creation-bootstrap-creating`) with `Starting architecture…` — not mixed with resume cards.
- **Behavioral change:** empty registry no longer auto-creates and redirects on page load.

## Action hierarchy

When drafts exist:

1. **Continue draft** (primary on the most recent card)
2. **Start new architecture** (outline)
3. **View all drafts** → `/architectures`

When no drafts:

1. **Start new architecture** (primary)
2. **View all drafts**

Start-new clears the session draft id, disables duplicate submits while in flight, and on failure restores the ready UI with existing drafts intact.

## Architecture-versus-review clarification

Restrained helper copy on the entry page:

> Creating or saving an architecture does not start a review.

Autosave reassurance (supported by `useArchitectureDraftAutosave` on the draft editor):

> Architecture drafts are saved automatically.

Continue and Start-new only navigate to `/architectures/{id}` — never `/reviews/*` and never invoke review-start APIs from this page.

## Empty-state behavior change

Previously: zero local drafts → immediate `initializeArchitectureCreation()` + `router.replace`.  
Now: stable empty guidance + explicit **Start new architecture** click required.

## Files changed

- `archlucid-ui/src/app/(operator)/architectures/new/page.tsx` (lead copy via constant)
- `archlucid-ui/src/components/architecture/ArchitectureCreationBootstrap.tsx`
- `archlucid-ui/src/components/architecture/ArchitectureCreationBootstrap.test.tsx`
- `archlucid-ui/src/lib/architecture/architecture-draft-status.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-status.test.ts` (new)
- `archlucid-ui/src/lib/architecture/architecture-draft-registry.ts`
- `archlucid-ui/src/lib/architecture/architecture-workflow-labels.ts`
- `archlucid-ui/src/lib/create-vs-review-intake-copy.ts`
- `docs/architecture/create_architecture_entry_page_refinement.md` (this report)

## Tests run

From `archlucid-ui/`:

```text
npx vitest run \
  src/components/architecture/ArchitectureCreationBootstrap.test.tsx \
  src/lib/architecture/architecture-draft-status.test.ts \
  src/lib/breadcrumb-map.test.ts \
  src/lib/create-vs-review-intake-differentiation.test.ts
```

### Test results

| Suite | Result |
|-------|--------|
| `ArchitectureCreationBootstrap.test.tsx` | 6 passed |
| `architecture-draft-status.test.ts` | 6 passed |
| `breadcrumb-map.test.ts` | 36 passed |
| `create-vs-review-intake-differentiation.test.ts` | 4 passed |
| **Total** | **52 passed** |

### Lint / typecheck

- Scoped ESLint on touched files: **pass** (`eslint=0`).
- `tsc --noEmit`: **fail for unrelated pre-existing errors** (not introduced by RC12):
  - `.next/types/validator.ts` missing `settings/cost-reporting/page.js`
  - `admin/deployment-status/...` missing `@/lib/demo`
- Full UI production build: **skipped** because repo-wide typecheck is not clean for reasons outside this change.

## Remaining draft-workflow limitations

- `/architectures` (full draft inventory) is still not a primary-nav item; it remains reachable from this page and related hubs.
- Recent-draft preview is capped at three entries; full management stays on `/architectures`.
- Registry is client-local (`localStorage`); server-only drafts not yet mirrored into the registry will not appear until the operator opens/saves them in-session.
- Optional “Open draft details” secondary action was omitted — no separate details surface beyond the draft editor.
- Draft editor, question set, autosave implementation, and review handoff were intentionally left unchanged.
