> **Scope:** Accessibility and procurement reviewers mapping **WCAG 2.1 Level A and AA** criteria to **repository test artifacts** and **CI jobs** for ArchLucid web UI; companion to [`VPAT_2_5_WCAG_2_1_AA.md`](VPAT_2_5_WCAG_2_1_AA.md). This is an evidence index, not a substitute for the conformance judgments in the VPAT.

# VPAT evidence map — WCAG 2.1 A / AA ↔ tests and CI

**Related ACR:** [`docs/security/VPAT_2_5_WCAG_2_1_AA.md`](VPAT_2_5_WCAG_2_1_AA.md)

**How to read this document**

- **Merge-blocking** means the GitHub Actions job fails the PR when the check fails (see [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).
- **Axe** cannot prove full conformance for every success criterion; where the map says “axe rules,” it means “rules in the configured tag bundle may fire on this criterion’s topic—**zero serious/critical violations** is evidence, not certification.”
- **No row below** claims complete manual WCAG conformance testing.

---

## 1. Continuous integration jobs

| Job (workflow) | Command / driver | Merge-blocking | Role |
| -------------- | ---------------- | :------------: | ---- |
| `ui-e2e-live` ([`ci.yml`](../../.github/workflows/ci.yml)) | `playwright test` (default live config) | Yes | Full-browser **`@axe-core/playwright`** on enumerated routes + focus/skip-link/announcer tests |
| `ui-axe-components` ([`ci.yml`](../../.github/workflows/ci.yml)) | `npm run test:axe-components` → `vitest run src/accessibility` | Yes | Isolated **jest-axe** runs on rendered React trees |

---

## 2. Playwright — live API + SQL (`ui-e2e-live`)

### 2.1 [`archlucid-ui/e2e/helpers/axe-helper.ts`](../../archlucid-ui/e2e/helpers/axe-helper.ts)

`AxeBuilder.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])`.

**Effect:** enables axe-core rules tagged for WCAG 2.0/2.1 Level A and AA (plus best-practice). Individual rules map to specific success criteria in axe’s metadata (see rule `helpUrl` in failure output).

### 2.2 [`archlucid-ui/e2e/live-api-accessibility.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility.spec.ts)

- **Behavior:** navigates each route in `PAGES`, waits for `main`, runs **`runAxe`**, fails if any violation has **impact** `critical` or `serious`.
- **WCAG relevance (when no failures):** broad **automated** signal for criteria commonly covered by axe rules under the tag bundle—e.g. **1.1.1** (non-text; partial), **1.3.1**, **1.4.3**, **1.4.11** (partial), **2.4.2**, **2.4.4** (partial), **3.3.1** / **3.3.2** (partial, where form rules apply), **4.1.1** (partial, e.g. duplicate `id`), **4.1.2** (partial).
- **Limits:** routes are **enumerated**, not every future URL; **complex graphics** (graphs, provenance canvases) may pass axe while still having **1.1.1** gaps; **time-based media**, **timeouts**, and **keyboard-only** completeness are **not** established by this file alone.

### 2.3 [`archlucid-ui/e2e/live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts)

| Test | WCAG criteria (evidence role) |
| ---- | ----------------------------- |
| Skip link moves focus to `#main-content` | **2.4.1** (bypass blocks) — **targeted** automated check |
| Client navigation focuses `#main-content` | **2.4.3** (focus order / focus management after navigation) — **partial** evidence |
| Route announcer text after navigation | **4.1.3** (status messages) — **partial**: proves announcer updates for one flow; not all status patterns |
| Axe in dark mode (home) | **1.4.3** / **1.4.11** — **partial** (contrast-related rules in alternate theme) |

---

## 3. Vitest + jest-axe (`ui-axe-components`)

**Command:** `npm run test:axe-components` → [`archlucid-ui/src/accessibility/*.test.tsx`](../../archlucid-ui/src/accessibility/)

**Behavior:** `expect(await axe(container)).toHaveNoViolations()` on **scoped** DOM fragments (default jest-axe / axe-core rule engagement—overlap with WCAG is high but not identical to the Playwright tag filter).

| Test file | Surfaces exercised (summary) | WCAG relevance (when passing) |
| --------- | ----------------------------- | ------------------------------ |
| [`marketing-pages-axe.test.tsx`](../../archlucid-ui/src/accessibility/marketing-pages-axe.test.tsx) | Marketing pages (e.g. get-started, pricing, see-it, compliance journey, ROI bulletin, privacy) | **1.x / 2.4.x / 3.x / 4.1.x** — partial via axe on those renders |
| [`marketing-accessibility-public-axe.test.tsx`](../../archlucid-ui/src/accessibility/marketing-accessibility-public-axe.test.tsx) | Public `/accessibility` view | Same bundle; **policy/marketing** content |
| [`trial-marketing-axe.test.tsx`](../../archlucid-ui/src/accessibility/trial-marketing-axe.test.tsx) | Trial + related marketing | Same |
| [`operator-shell-components-axe.test.tsx`](../../archlucid-ui/src/accessibility/operator-shell-components-axe.test.tsx) | `SectionCard`, `ShortcutHint`, `ContextualHelp` | **1.3.1**, **4.1.2**, tooltip/dialog patterns — partial |
| [`layer-context-strip-axe.test.tsx`](../../archlucid-ui/src/accessibility/layer-context-strip-axe.test.tsx) | `LayerContextStrip` | Landmarks/labels — partial |
| [`search-ask-pages-axe.test.tsx`](../../archlucid-ui/src/accessibility/search-ask-pages-axe.test.tsx) | Search + Ask operator pages | Forms, structure — partial |
| [`operator-analysis-axe.test.tsx`](../../archlucid-ui/src/accessibility/operator-analysis-axe.test.tsx) | Compare, replay, graph pages (mocked data) | Includes **graph** route render — **1.1.1** / **2.5.1** still not proven |
| [`operator-governance-axe.test.tsx`](../../archlucid-ui/src/accessibility/operator-governance-axe.test.tsx) | Governance-related operator pages | Partial |
| [`operator-alerts-axe.test.tsx`](../../archlucid-ui/src/accessibility/operator-alerts-axe.test.tsx) | Alerts operator pages | Partial |
| [`operator-value-pages-axe.test.tsx`](../../archlucid-ui/src/accessibility/operator-value-pages-axe.test.tsx) | Value report / advisory surfaces | Partial |
| [`demo-leak-scan.test.tsx`](../../archlucid-ui/src/accessibility/demo-leak-scan.test.tsx) | `LegacyRunComparisonView`, `RunProvenanceInline`, forbidden-string guard | Axe on demo views — partial **1.1.1** / **4.1.x** on those trees only |

---

## 4. Radix UI primitives (design system)

**Dependencies:** [`archlucid-ui/package.json`](../../archlucid-ui/package.json) (`@radix-ui/react-*`).

| WCAG topic | Typical Radix contribution | ArchLucid evidence |
| ---------- | --------------------------- | ------------------- |
| **2.1.1** Keyboard | Focus management, roving tabindex patterns in menus/dialogs | **Design-level** assist; **plus** `live-api-accessibility-focus.spec.ts` for shell focus reset |
| **2.1.2** No keyboard trap | Focus scope + restore on dialog close | **Partial** — not every dialog path exercised |
| **4.1.2** Name, Role, Value | ARIA wiring for dialog, select, tooltip, collapsible | **Partial** — verified only where covered by axe scans + component tests |
| **1.4.13** Content on Hover or Focus | Tooltip/dialog dismissal patterns in primitives | **Not** systematically verified per instance |

Radix does **not** remove the need for correct **application** usage (labels, composition, custom content).

---

## 5. Product code called out in VPAT (not replacing tests)

| Artifact | Note |
| -------- | ---- |
| [`archlucid-ui/src/components/RunProgressTracker.tsx`](../../archlucid-ui/src/components/RunProgressTracker.tsx) | `aria-live="polite"` — **4.1.3** evidence for that component |
| [`archlucid-ui/src/components/RouteAnnouncer.tsx`](../../archlucid-ui/src/components/RouteAnnouncer.tsx) | `aria-live="polite"` + e2e assertion in focus spec |

---

## 6. WCAG 2.1 Level A and AA — criterion index (50)

**Columns:** **Primary evidence** lists the strongest repo-linked signals; **None** means no targeted automated test for that SC (VPAT may still record Not Evaluated / N/A).

| # | Criterion | Level | Primary evidence | Notes |
| -- | --------- | ----- | ---------------- | ----- |
| 1 | 1.1.1 Non-text Content | A | `live-api-accessibility.spec.ts`; jest-axe suites (esp. operator-analysis with graph page mock) | Graph/provenance **semantic** alternatives not fully tested |
| 2 | 1.2.1 Audio-only or Video-only (Prerecorded) | A | None | Treat as **out of scope** unless media is embedded |
| 3 | 1.2.2 Captions (Prerecorded) | A | None | |
| 4 | 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | None | |
| 5 | 1.2.4 Captions (Live) | AA | None | |
| 6 | 1.2.5 Audio Description (Prerecorded) | AA | None | |
| 7 | 1.3.1 Info and Relationships | A | Axe tag bundle (live + component) | Custom dashboards/graphs partial |
| 8 | 1.3.2 Meaningful Sequence | A | Axe + DOM order on scanned routes | |
| 9 | 1.3.3 Sensory Characteristics | A | None | Manual judgement |
| 10 | 1.3.4 Orientation | AA | None (implicit responsive CSS) | |
| 11 | 1.3.5 Identify Input Purpose | AA | Axe form/autocomplete rules when applicable | Not exhaustively audited |
| 12 | 1.4.1 Use of Color | A | Axe (`link-in-text-block`, color-adjacent rules) | Manual gap for status semantics |
| 13 | 1.4.2 Audio Control | A | None | |
| 14 | 1.4.3 Contrast (Minimum) | AA | `live-api-accessibility.spec.ts`; `live-api-accessibility-focus.spec.ts` (dark); jest-axe | Not every state/token |
| 15 | 1.4.4 Resize Text | AA | None | |
| 16 | 1.4.5 Images of Text | AA | Axe on scanned pages | |
| 17 | 1.4.10 Reflow | AA | None | |
| 18 | 1.4.11 Non-text Contrast | AA | Axe tag bundle | Graphical nodes/edges partial |
| 19 | 1.4.12 Text Spacing | AA | None | |
| 20 | 1.4.13 Content on Hover or Focus | AA | Radix primitives | No systematic hover/focus-dismiss matrix |
| 21 | 2.1.1 Keyboard | A | Radix + `live-api-accessibility-focus.spec.ts` | Not every control path |
| 22 | 2.1.2 No Keyboard Trap | A | Radix | Overlays not all exercised |
| 23 | 2.1.4 Character Key Shortcuts | A | None | |
| 24 | 2.2.1 Timing Adjustable | A | None | |
| 25 | 2.2.2 Pause, Stop, Hide | A | None | |
| 26 | 2.3.1 Three Flashes or Below Threshold | A | None | |
| 27 | 2.4.1 Bypass Blocks | A | `live-api-accessibility-focus.spec.ts` (skip link) | |
| 28 | 2.4.2 Page Titled | A | `live-api-accessibility.spec.ts` (axe `document-title`) | |
| 29 | 2.4.3 Focus Order | A | `live-api-accessibility-focus.spec.ts` (post-nav focus) | Partial |
| 30 | 2.4.4 Link Purpose (In Context) | A | Axe link/name rules on scanned routes | |
| 31 | 2.4.5 Multiple Ways | AA | None | Information architecture only |
| 32 | 2.4.6 Headings and Labels | AA | Axe | |
| 33 | 2.4.7 Focus Visible | AA | Axe (partial); [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md) documents deferrals | |
| 34 | 2.5.1 Pointer Gestures | A | None | Graph gestures |
| 35 | 2.5.2 Pointer Cancellation | A | None | |
| 36 | 2.5.3 Label in Name | A | Axe label/content rules | |
| 37 | 2.5.4 Motion Actuation | A | None | |
| 38 | 3.1.1 Language of Page | A | None (Next defaults) | |
| 39 | 3.1.2 Language of Parts | AA | None | |
| 40 | 3.2.1 On Focus | A | None | |
| 41 | 3.2.2 On Input | A | None | |
| 42 | 3.2.3 Consistent Navigation | AA | None | |
| 43 | 3.2.4 Consistent Identification | AA | None | |
| 44 | 3.3.1 Error Identification | A | Axe form/error rules where applicable | |
| 45 | 3.3.2 Labels or Instructions | A | Axe + jest-axe form surfaces | |
| 46 | 3.3.3 Error Suggestion | AA | None | |
| 47 | 3.3.4 Error Prevention (Legal, Financial, Data) | AA | None | Governance review, not axe |
| 48 | 4.1.1 Parsing | A | Axe (`duplicate-id`, related) | Framework-generated markup |
| 49 | 4.1.2 Name, Role, Value | A | Axe + Radix + jest-axe | Custom widgets/graphs higher risk |
| 50 | 4.1.3 Status Messages | AA | `RouteAnnouncer`, `RunProgressTracker`, other `aria-live` (code); `live-api-accessibility-focus.spec.ts` (announcer text) | Not all toast/async messages cataloged |

---

## Document history

| Date | Change |
| ---- | ------ |
| 2026-04-30 | Initial evidence map for VPAT 2.5 WCAG 2.1 A/AA. |
