# UX: De-densify Presenter Overlay — Presenter-Only vs Audience-Safe Split

## Goal
The `BuyerCtoDemoTourOverlay` currently stacks 8–10 distinct UI blocks in a single panel. When the CTO's screen is shared, the audience sees teleprompter notes, panic buttons, smoke-check results, and debug controls — which reads as "this presenter is reading from a script." Split the overlay into a minimal audience-safe view (default) and a full presenter-only view (toggled).

## Context
- `BuyerCtoDemoTourOverlay.tsx` (1295 lines) currently renders all of the following in one panel:
  1. Step label + timer + autoplay badge
  2. Presenter notes (full script or summary)
  3. Compare drift link (step 3 only)
  4. Panic script section (amber box, always shown when notes visible)
  5. Story selector (step 1 only)
  6. Smoke check button + results
  7. Keyboard hint
  8. Notes/script/CTO-questions/autoplay toggle buttons
  9. Step indicator chips
  10. Recap card (step 5)
  11. Back/Next navigation

Everything is in the bottom-right corner, visible to the audience on a shared screen.

## What to build

### 1. Define two display layers

**Audience-safe (default):**
- Step indicator chips (1. Executive → 2. Manifest → … — the CTO can see where we are)
- Timer (the CTO can see we're on schedule)
- Back / Next navigation buttons
- Autoplay badge (if autoplay is on)

**Presenter-only (toggled, hidden by default):**
- Presenter notes (script/summary)
- Compare drift link
- Panic script section
- Story selector
- Smoke check
- CTO questions panel
- Keyboard hint
- Notes-mode / CTO-questions / autoplay toggle buttons

### 2. Add `presenterLayerVisible` state
In `BuyerCtoDemoTourOverlay.tsx`, add state:
```typescript
const [presenterLayerVisible, setPresenterLayerVisible] = useState(false);
```
Default: `false` — the panel opens audience-safe by default.

Persist in `localStorage` via new helpers `writeCtoDemoPresenterLayerVisible` / `readCtoDemoPresenterLayerVisible` in `buyer-cto-demo-tour.ts`.

### 3. Presenter toggle button
In the overlay header row (next to Compact / Collapse / Explore), add:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => setPresenterLayerVisible(v => !v)}
  data-testid="cto-demo-presenter-layer-toggle"
>
  {presenterLayerVisible ? "Audience view" : "Presenter"}
</Button>
```

Keyboard shortcut: `P` (add to `useBuyerCtoDemoTourKeyboard.ts`). Update the keyboard hint copy.

### 4. Guard all presenter-only blocks
Wrap every presenter-only section with `{presenterLayerVisible ? (...) : null}`:
- The presenter notes `<p>` block
- The compare drift link
- The panic script amber box
- The story selector (`CtoDemoStorySelector`)
- The smoke check button + results
- The keyboard hint
- The notes-mode and CTO-questions toggle buttons
- The autoplay toggle button

Audience-safe blocks (always shown):
- Step header (step label + timer + autoplay badge)
- Step indicator chips `<ol>`
- `<CtoDemoRecapCard />` on step 5 (this is audience-facing — it shows the summary)
- Back / Next / End tour buttons
- Compact / Collapse / Explore / Presenter buttons (header row)

### 5. Visual treatment of presenter layer
When `presenterLayerVisible`:
- Add a subtle `border-t border-amber-200/60 mt-3 pt-3` divider above the presenter section.
- Add a `text-[10px] text-amber-700 font-semibold uppercase tracking-wide` label `"Presenter only"` above the divider (not visible in audience-safe mode).

This makes it clear that the presenter toggled a second layer, not that the overlay always showed this.

## Acceptance criteria
- Default state (fresh session): only step chips + timer + Back/Next visible.
- Clicking "Presenter" reveals all presenter-only blocks.
- Clicking "Audience view" hides them.
- Pressing `P` toggles the presenter layer.
- `presenterLayerVisible` persists across soft navigation in the same session.
- All existing `BuyerCtoDemoTourOverlay.test.tsx` tests pass.
- New tests: presenter layer hidden by default; toggle shows/hides presenter blocks; `P` key triggers toggle.
- The amber "Presenter only" label is not visible in audience-safe mode.
