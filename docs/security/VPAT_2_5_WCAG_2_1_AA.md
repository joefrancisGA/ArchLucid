> **Scope:** Procurement, accessibility, and legal reviewers; ITI VPAT® 2.5–style Accessibility Conformance Report (ACR) for ArchLucid **web content** (marketing and operator UI) against **WCAG 2.1 Level A and AA**; not a legal determination of compliance, not covering non-web REST API or CLI except as noted.

# Accessibility Conformance Report — ArchLucid (VPAT® 2.5 structure, WCAG 2.1)

**Based on:** [ITI Voluntary Product Accessibility Template (VPAT®) 2.5](https://www.itic.org/policy/accessibility/vpat) — **WCAG** edition reporting columns adapted to Markdown. The VPAT® name and form are ITI registered service marks; this document is an in-repo ACR aligned with that structure.

**Report date:** 2026-04-30

---

## Instructions and disclaimers

This report uses the four conformance levels defined by ITI for VPAT **2.5**: **Supports**, **Partially Supports**, **Does Not Support**, and **Not Applicable**. **Not Evaluated** is used only where no substantive evidence was available for this revision.

**Honest limitations:** Conformance is assessed primarily from **automated** `@axe-core/playwright` and **jest-axe** runs documented in the repository, plus **focused** Playwright keyboard/announcer tests and **targeted** code review (e.g. live regions). **Comprehensive** manual screen reader testing across all workflows has **not** been performed. **Complex interactive graphics** (knowledge graph, provenance/diagram canvases) may not fully satisfy **1.1.1** or related criteria without additional alternatives; see remarks.

**Out of product scope for WCAG tables below:** The ArchLucid **REST API** and **CLI** are not *web pages* under WCAG 2.1. They are listed in product information for completeness; they are **Not Applicable** to the WCAG success criteria in Section 2 unless a criterion explicitly concerns authored documentation shipped as web content.

---

## Section 1: Product information

| Field | Value |
| ----- | ----- |
| **Product name** | ArchLucid |
| **Product version** | V1 |
| **Product description** | AI architecture intelligence platform — **web-based** operator console (Next.js), **REST API** (.NET), and **CLI** tooling. Primary human-facing WCAG scope is the **marketing site** and **operator web application** hosted under the same product boundary. |
| **Report types / standards in this document** | **WCAG 2.1** (Level **A** and **AA** success criteria only — **50** criteria). |
| **Contact for accessibility information** | *Placeholder — product owner / accessibility contact (TBD).* Public routing channel referenced in [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md): `accessibility@archlucid.net` |
| **Vendor / supplier** | ArchLucid (see repository and procurement materials). |

### Evaluation methods used

| Method | Detail |
| ------ | ------ |
| **Automated (merge-blocking)** | **`@axe-core/playwright`** with tags **`wcag2a`**, **`wcag2aa`**, **`wcag21a`**, **`wcag21aa`**, and **`best-practice`** (see [`archlucid-ui/e2e/helpers/axe-helper.ts`](../../archlucid-ui/e2e/helpers/axe-helper.ts)). **Critical** and **serious** violations fail the **`ui-e2e-live`** job in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). |
| **Automated (merge-blocking)** | **jest-axe** + Vitest on representative **component/page** renders under [`archlucid-ui/src/accessibility/`](../../archlucid-ui/src/accessibility/) via job **`ui-axe-components`** (`npm run test:axe-components`). |
| **Keyboard / focus (merge-blocking)** | Playwright tests in [`archlucid-ui/e2e/live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts): skip link, client navigation focus management, route announcer text, axe in **dark** mode. |
| **Screen reader** | **Spot-checks only** (not comprehensive); no systematic NVDA/VoiceOver test matrix is claimed. |
| **Manual visual / contrast** | **Not** performed as a full design-system audit; reliance on axe **color-contrast** rules with known limitations for non-text and custom widgets. |

### Related repository artifacts

- Operator + marketing automated page list: [`archlucid-ui/e2e/live-api-accessibility.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility.spec.ts)
- Accessibility posture summary: [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md)
- **Evidence mapping (criteria ↔ tests):** [`VPAT_EVIDENCE_MAP.md`](VPAT_EVIDENCE_MAP.md)

---

## Section 2: WCAG 2.1 Level A and AA success criteria

**Column definitions (VPAT-style):**

| Column | Meaning |
| ------ | ------- |
| **Criteria** | WCAG 2.1 success criterion identifier and short name |
| **Level** | **A** or **AA** |
| **Conformance** | **Supports** / **Partially Supports** / **Does Not Support** / **Not Applicable** / **Not Evaluated** |
| **Remarks and explanations** | Evidence, limits, and honest gaps |

### Principle 1: Perceivable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 1.1.1 Non-text Content | A | Partially Supports | **Supports** for many decorative/informative patterns where axe `image-alt` and related rules apply on the **CI-scanned routes** (see live e2e list). **Gap:** complex **graph/diagram** canvases (e.g. React Flow–based views) and dynamic graphics may lack **complete** text equivalents or may rely on surrounding prose; axe cannot certify semantic equivalence for all infographic-style content. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not Applicable | Product web UI is not primarily an audio/video player; no commitment that all possible embedded media is absent. Treat as **N/A** for standard operator flows unless media is introduced. |
| 1.2.2 Captions (Prerecorded) | A | Not Applicable | Same as 1.2.1 for current scope. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not Applicable | Same as 1.2.1 for current scope. |
| 1.2.4 Captions (Live) | AA | Not Evaluated | No systematic test evidence for live media. |
| 1.2.5 Audio Description (Prerecorded) | AA | Not Evaluated | No systematic test evidence for prerecorded video. |
| 1.3.1 Info and Relationships | A | Partially Supports | Automated rules (`label`, `list`, `listitem`, headings/landmarks, ARIA-related rules) run in CI; **Partially** because relationship semantics for custom components and dense dashboards are not exhaustively validated. |
| 1.3.2 Meaningful Sequence | A | Partially Supports | Implied by DOM order on scanned pages + no critical axe findings for reading-order rules where applicable; **not** fully manually audited on all responsive breakpoints. |
| 1.3.3 Sensory Characteristics | A | Not Evaluated | Requires manual judgment of instructions; not systematically tested. |
| 1.3.4 Orientation | AA | Partially Supports | Layout uses responsive patterns; **not** proven that **every** view never locks orientation in a violating way via automation alone. |
| 1.3.5 Identify Input Purpose | AA | Partially Supports | Autocomplete/autofill attributes were not comprehensively audited; some forms may meet SC, others **Not Evaluated** in detail. |
| 1.4.1 Use of Color | A | Partially Supports | Axe `link-in-text-block` and color-related heuristics help; **manual** review not complete for all status semantics conveyed by color. |
| 1.4.2 Audio Control | A | Not Applicable | No auto-playing audio in standard flows (if third-party or future media added, reassess). |
| 1.4.3 Contrast (Minimum) | AA | Partially Supports | **Verified in part by automated Axe-core testing in CI (merge-blocking)** (`color-contrast` and related) on **enumerated** routes and **jest-axe** surfaces, including a **dark mode** axe sweep ([`live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts)). **Caveat:** automated contrast does not cover **every** interactive state, **all** custom tokens, or non-text in all edge cases. |
| 1.4.4 Resize text | AA | Partially Supports | Layout is responsive; **200% zoom** behavior not proven for every nested table/dialog via automated suite. |
| 1.4.5 Images of Text | AA | Partially Supports | Marketing and UI may use text-in-images in places; not fully audited. |
| 1.4.10 Reflow | AA | Partially Supports | General responsive design; **not** exhaustively tested at 320 CSS px for every view. |
| 1.4.11 Non-text Contrast | AA | Partially Supports | Axe rules provide partial coverage for UI components and graphics; graph edges/nodes and bespoke icons may **not** be fully covered. |
| 1.4.12 Text Spacing | AA | Not Evaluated | No dedicated CSS override test in CI. |
| 1.4.13 Content on Hover or Focus | AA | Not Evaluated | Tooltips/popovers use Radix primitives; hover/floating content not systematically exercised for dismissibility/persistence across all instances. |

### Principle 2: Operable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 2.1.1 Keyboard | A | Supports | **Radix UI** primitives (dialog, select, tooltip, collapsible, etc.) provide baseline keyboard patterns ([`archlucid-ui/package.json`](../../archlucid-ui/package.json) dependencies). **Merge-blocking** focus tests validate skip link and post-navigation focus to `#main-content` ([`live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts)). **Caveat:** **comprehensive** keyboard coverage of every wizard step, table shortcut, and custom control is **not** claimed. |
| 2.1.2 No Keyboard Trap | A | Partially Supports | Focus management is implemented for route changes; modal/dialog traps expected with Radix. **Not** systematically validated for every overlay. |
| 2.1.4 Character Key Shortcuts | A | Not Evaluated | Single-key shortcuts not systematically audited. |
| 2.2.1 Timing Adjustable | A | Not Evaluated | Session/time limits or timed interactions not covered by axe baseline. |
| 2.2.2 Pause, Stop, Hide | A | Not Evaluated | Moving/blinking content not systematically audited (toast/sonner surfaces not exhaustively). |
| 2.3.1 Three Flashes or Below Threshold | A | Not Evaluated | Not measured with photosensitive seizure analysis tools. |
| 2.4.1 Bypass Blocks | A | Partially Supports | **Skip to main content** link exists and is **verified** to move focus ([`live-api-accessibility-focus.spec.ts`](../../archlucid-ui/e2e/live-api-accessibility-focus.spec.ts)). Landmark structure improved by scanning but **not** proven equivalent to “bypass all blocks” on every dense page. |
| 2.4.2 Page Titled | A | Supports | **Verified by automated Axe-core testing in CI (merge-blocking)** (`document-title` and related) on scanned routes. |
| 2.4.3 Focus Order | A | Partially Supports | No dedicated focus-order audit matrix; reliance on DOM order + Radix + route focus reset. |
| 2.4.4 Link Purpose (In Context) | A | Partially Supports | Axe link-text rules on scanned surfaces; dense tables/menus not manually audited. |
| 2.4.5 Multiple Ways | AA | Partially Supports | Navigation shell + search exist; **not** proven for every destination via multiple methods. |
| 2.4.6 Headings and Labels | AA | Partially Supports | **Verified in part** by automated rules on scanned pages; forms and dense views not fully audited. |
| 2.4.7 Focus Visible | AA | Partially Supports | Default/ Tailwind / component styles; **not** manually verified for every state; moderate axe findings may be deferred per [`ACCESSIBILITY.md`](../../ACCESSIBILITY.md). |
| 2.5.1 Pointer Gestures | A | Not Evaluated | Complex gestures (e.g. graph pan/zoom) not systematically assessed for path-based alternatives. |
| 2.5.2 Pointer Cancellation | A | Not Evaluated | Fine-grained click/down/up behavior not systematically tested. |
| 2.5.3 Label in Name | A | Partially Supports | Axe `label` rules help; custom controls may still diverge. |
| 2.5.4 Motion Actuation | A | Not Evaluated | Device motion inputs not a primary interaction; not systematically validated. |

### Principle 3: Understandable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 3.1.1 Language of Page | A | Partially Supports | `lang` on document assumed for Next.js defaults; **not** explicitly asserted by dedicated test. |
| 3.1.2 Language of Parts | AA | Not Evaluated | Mixed-language fragments not systematically checked. |
| 3.2.1 On Focus | A | Partially Supports | Focus changes should not unexpectedly submit; **not** exhaustively tested. |
| 3.2.2 On Input | A | Partially Supports | SPA routing and forms; **not** exhaustively tested for unexpected context changes on every control. |
| 3.2.3 Consistent Navigation | AA | Partially Supports | Shell navigation is consistent by design; **not** formally audited across all route permutations. |
| 3.2.4 Consistent Identification | AA | Partially Supports | Design system reuse; **not** formally audited. |
| 3.3.1 Error Identification | A | Partially Supports | Error rendering varies by surface; **not** fully covered by axe on every form. |
| 3.3.2 Labels or Instructions | A | Partially Supports | Axe form/label rules on scanned content; complex wizards only partially covered. |
| 3.3.3 Error Suggestion | AA | Not Evaluated | |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Partially Supports | Destructive or high-impact actions may appear in operator flows; **not** exhaustively audited against every submission pattern. Customers should review **tenant-specific** governance and deletion paths during procurement. |

### Principle 4: Robust

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 4.1.1 Parsing | A | Partially Supports | WCAG 2.1 **4.1.1** (markup validity). **Partial** reliance on framework output and axe rules that surface issues such as **duplicate `id`** (`duplicate-id`); no manual validation of every template against the full parsing requirement. |
| 4.1.2 Name, Role, Value | A | Partially Supports | **Verified in part** by automated Axe-core on scanned routes and component tests; custom widgets and canvases remain higher risk. |
| 4.1.3 Status Messages | AA | Partially Supports | **Supports** for **specific** implementations: e.g. **`RunProgressTracker`** exposes **`aria-live="polite"`** (`archlucid-ui/src/components/RunProgressTracker.tsx`), **`RouteAnnouncer`** uses **`aria-live="polite"`** (`RouteAnnouncer.tsx`), and other `aria-live` regions exist (audit page, runs list, wizard). **Product-wide:** not all dynamic status messages are cataloged or verified for this SC. |

---

## Legal disclaimer

This Accessibility Conformance Report is provided for **informational** purposes to assist customers and procurement teams. It does **not** constitute a **legal warranty** or **certification** of compliance with any statute or regulation.

---

## Document history

| Date | Change |
| ---- | ------ |
| 2026-04-30 | Initial ACR (Markdown) aligned to VPAT® 2.5 WCAG reporting structure. |
