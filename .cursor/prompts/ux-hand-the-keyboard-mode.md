# UX: "Hand the Keyboard" Overlay-Free Explore Mode

## Goal
Add a one-key toggle that completely hides the `BuyerCtoDemoTourOverlay` and enters a clean "explore" state, so when a CTO wants to drive the demo themselves the product stops looking scripted. The tour state is preserved; a single click/key restores it.

## Context
- Current state: `BuyerCtoDemoTourOverlay` renders persistently in the bottom-right corner whenever the tour is active. A CTO who takes the mouse sees a teleprompter-style overlay covering part of the screen, which signals "this is rehearsed."
- The overlay is already collapsible (bottom-right button chip), but collapsing still shows the heading + step number — still visible.
- Key files:
  - `archlucid-ui/src/components/BuyerCtoDemoTourOverlay.tsx` — main overlay (1295 lines); has `collapsed` and `compact` state already
  - `archlucid-ui/src/lib/buyer-cto-demo-tour.ts` — localStorage helpers (`writeBuyerCtoDemoTourCollapsed`, `readBuyerCtoDemoTourCollapsed`)
  - `archlucid-ui/src/hooks/useBuyerCtoDemoTourKeyboard.ts` — keyboard shortcuts

## What to build

### 1. "Explore mode" state
Add a third visibility state beyond `collapsed` and `compact`: **explore mode**.

- In explore mode: the entire overlay (including the collapsed chip) is hidden. Nothing is rendered.
- A tiny **"Resume tour"** floating affordance appears instead — a single pill button, bottom-right, `z-[9990]`, 28px tall, text `"Tour"`, with a back-arrow icon. It must not cover any content wider than ~52px.
- Persist explore mode in `localStorage` via a new pair of helpers `writeBuyerCtoDemoExploreMode` / `readBuyerCtoDemoExploreMode` in `buyer-cto-demo-tour.ts`.

### 2. Keyboard shortcut
Add key `E` (while tour is active) to `useBuyerCtoDemoTourKeyboard.ts`:
- `E` toggles explore mode on/off.
- Update the keyboard hint copy in `BUYER_CTO_DEMO_TOUR_KEYBOARD_HINT` (in `buyer-polish-copy.ts` or wherever it's defined) to include "E: explore / resume."

### 3. "Hand the keyboard" CTA in the overlay
In `BuyerCtoDemoTourOverlay.tsx`, in the control strip next to "Compact" and "Collapse":
- Add a button labeled `"Explore"` (or icon `↗`) that activates explore mode.
- Tooltip: `"Hide overlay so CTO can drive — press E or click Resume to restore"`

### 4. Resume affordance
The `"Tour"` resume pill:
- Clicking it deactivates explore mode and restores the overlay to whatever `collapsed`/`compact` state it was in before explore was enabled.
- The pill must use `pointer-events-auto` and be visually minimal (neutral border, white bg, `shadow-sm`).
- It must not render when the tour is not active.

## Acceptance criteria
- Pressing `E` while tour is active hides the overlay completely; only the `"Tour"` pill remains.
- Pressing `E` again (or clicking the pill) restores the overlay at its prior state.
- Explore mode persists across soft navigation within the same session.
- Explore mode is cleared when `endTour()` is called.
- Existing `BuyerCtoDemoTourOverlay.test.tsx` tests still pass; add tests for explore-mode toggle and resume pill rendering.
- The `"Tour"` pill never covers page content wider than 56px.

## Constraints
- Do not add new state management libraries.
- The resume pill must satisfy the design-token constraints: neutral surface, `text-[11px]` or `OPERATOR_TYPOGRAPHY.badge`, no bright colors.
- `isBuyerPolishedOperatorShellEnv()` guard must remain — explore mode is a buyer-polished shell feature only.
