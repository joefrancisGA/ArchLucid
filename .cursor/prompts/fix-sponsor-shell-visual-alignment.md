# Fix: Executive shell — visual alignment with architect workspace

## Problem

Switching between the Architect workspace and Executive views causes cognitive dissonance because the two
shells differ on every visible dimension simultaneously:

| Dimension | Architect workspace (`AppShellClient`, route group `(operator)`) | Executive (`ExecutiveShellFrame`) |
|---|---|---|
| Content max-width | `max-w-[1600px]` (+ 248px sidebar) | `max-w-4xl` (~896px) on `<main>` |
| Page padding | `px-4 py-4 lg:px-6 lg:py-6` | `px-6 py-8` |
| Header feel | Two-rail header with search, scope, status chips | Single row: wordmark + 3 links + auth + theme |
| Header bg | Solid `bg-neutral-50` | Semi-transparent `bg-neutral-50/95 backdrop-blur` |
| Sidebar | Yes (hidden `lg:block`) | None |
| Nav typography | Sidebar: `text-sm` icon+label links | Flat `Button variant="ghost" size="sm"` links |
| Theme toggle position | Right end of secondary rail | Right end of header row |
| Breadcrumbs | Yes | No |
| Scope switcher / budget pill | Yes | No |

The dashboard content (`ExecutiveRoiDashboardPageView`) is designed for `max-w-6xl` (~1152px)
but is clamped by the executive frame's `max-w-4xl` `<main>`. The 3-column KPI grid reflows
to 2 columns and the trend charts compress. The user sees layout shift and narrower content
compared to the same data in the architect workspace.

The fix is **not** to make the executive shell identical to the architect workspace. The executive
view intentionally has no sidebar (it is a read-only stakeholder surface). The fix is to align
spacing, header construction, content width, and type tokens so it reads as the **same product
design**, just with a narrower navigation chrome.

## Scope

Changes are confined to `archlucid-ui/`. No .NET, no API, no docs changes.

## Fix

### 1. `ExecutiveShellFrame` — widen `<main>` and match header tokens

File: `archlucid-ui/src/components/ExecutiveShellFrame.tsx`

**Content width:** Change the `<main>` from `max-w-4xl` to `max-w-[1600px]`. The executive
dashboard content already constrains itself to `max-w-6xl` internally; the frame should not add
a second narrower ceiling.

```tsx
// Before
<main
  id="main-content"
  ...
  className="mx-auto max-w-4xl px-6 py-8 ..."
>

// After
<main
  id="main-content"
  ...
  className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6 lg:py-6 ..."
>
```

**Header background:** Remove the `backdrop-blur` and opacity from the header. The operator
shell uses solid `bg-neutral-50`; the blur is a stylistic divergence that makes the header feel
different.

```tsx
// Before
className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-950/95"

// After
className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
```

**Header inner padding:** Match the operator header (`px-4 lg:px-6`):

```tsx
// Before
<div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">

// After
<div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
```

**Nav link styling:** The executive nav links currently render as `Button variant="ghost" size="sm"`
with full button padding. Make them visually match the architect workspace's secondary-nav feel — same
size/variant, but strip the unnecessary `shrink-0` inconsistencies and use `text-neutral-700` for
inactive links and `font-semibold` only for the active one (matching `executiveNavLinkClassName`
which already does this). No functional change needed — just verify the helper is applied
consistently to all four nav links.

### 2. `ExecutiveRoiDashboardPageView` — align wrapper spacing

File: `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardPageView.tsx`

The outer wrapper uses `max-w-6xl` unconditionally. That is correct for the executive surface
now that the frame's `<main>` is widened. No change needed here unless the wrapper class was
also overriding padding (check and remove any `px-4` on the wrapper that would double-pad against
the frame's own padding).

### 3. `ExecutiveShellFrame` — add `OperatorShellTopBar` secondary rail hint

The executive header currently shows no context about which workspace/project is active and has
no scope switcher. For the executive surface the full scope switcher is unnecessary, but the
`TenantWorkspaceBoundaryBadge` (compact variant) should appear so the user knows which tenant
they are looking at. Add it to the right-side cluster next to `AuthPanel`:

```tsx
import { TenantWorkspaceBoundaryBadge } from "@/components/shell/TenantWorkspaceBoundaryBadge";

// In the right-side cluster:
<div className="flex items-center gap-2">
  <TenantWorkspaceBoundaryBadge variant="compact" />
  <AuthPanel />
  <ColorModeToggle />
</div>
```

### 4. `ExecutiveShellFrame` — `overflow-x-hidden` containment

Match the architect workspace. Add `overflow-x-hidden` to the root `<ShellReadySurface>` and the
sticky header wrapper so no wide executive content can cause horizontal scroll:

```tsx
<ShellReadySurface className="min-h-screen overflow-x-hidden bg-neutral-50 ...">
  ...
  <header ... className="... overflow-x-hidden">
```

## What NOT to change

- Do not add a sidebar to the executive frame. It is intentionally absent.
- Do not add the two-rail header with search, budget pill, or scope switcher — the executive
  frame is a read-only stakeholder surface without those operator controls.
- Do not change any API or data-fetching logic (see the separate prompt
  `fix-executive-dashboard-duplicate-fetches.md` for that).
- Do not change `ExecutiveShellFrame` `max-w-4xl` on the **header inner div** before reading
  the change above — the `<main>` and the header inner div both need updating to `max-w-[1600px]`.

## Acceptance criteria

1. At viewport width ≥ 1280px, the executive dashboard KPI grid renders in 3 columns (matching
   operator surface) rather than 2 columns caused by the old `max-w-4xl` clamp.
2. The executive header background is solid (no blur), the same as the operator header.
3. `TenantWorkspaceBoundaryBadge` (compact) appears in the executive header.
4. Horizontal scrollbar does not appear at any standard viewport width.
5. All existing executive shell Playwright / Vitest tests still pass.
6. `npm run typecheck` in `archlucid-ui/` passes.
7. No linter errors in edited files (`ReadLints` after each file change).

## Compile check

After completing edits, run the scoped compile check:

```powershell
.\scripts\ci\agent-compile-check.ps1 -Ui
```
