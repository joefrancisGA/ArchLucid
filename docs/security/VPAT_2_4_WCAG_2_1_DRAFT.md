> **Superseded:** Canonical procurement ACR is [`VPAT_2_5_WCAG_2_1_AA.md`](VPAT_2_5_WCAG_2_1_AA.md). This VPAT 2.4–structure draft is retained for historical comparison only.

> **Scope:** Procurement, accessibility reviewers, and security/compliance stakeholders evaluating **ArchLucid Operator UI** (web) against **WCAG 2.1 Level A and AA**; draft **VPAT® 2.4 Rev–style** ACR excerpt in Markdown; **not** a legal opinion, **not** certification, **not** a substitute for full manual conformance assessment across every workflow.

# Accessibility Conformance Report (Draft) — ArchLucid Operator UI

**Template basis:** [ITI Voluntary Product Accessibility Template (VPAT®)](https://www.itic.org/policy/accessibility/vpat), **WCAG 2.1** reporting columns aligned with **VPAT® 2.4 Rev** (four conformance columns: conformance level **+ remarks**). VPAT® is an ITI registered service mark.

**Edition reported:** WCAG **2.1** (Levels **A** and **AA** only — fifty success criteria).

**Draft disclaimer:** This document is provided for informational purposes and reflects the current state of automated accessibility testing. Manual evaluation of criteria marked **Not Evaluated** is recommended.

---

## Section 1: Product information

| Field | Value |
| ----- | ----- |
| **Product name** | ArchLucid Operator UI (web application) |
| **Product version** | V1 |
| **Product description** | Web-based architecture review and governance platform |
| **Vendor** | ArchLucid |
| **Report date** | 2026-05-10 |
| **Contact for accessibility / conformance information** | security@archlucid.net |
| **Out of WCAG evaluation scope for this draft** | ArchLucid REST API, CLI outputs, third-party tooling outside the assessed web UI chrome, audio/video authoring when not surfaced in assessed routes |

### Evaluation methods used (summary)

- **Automated:** **axe-core** via **jest-axe / Vitest** component tests and **Playwright axe** integration runs in CI (operator UI codebase).
- **Manual:** Formal manual protocol for all fifty criteria — **pending** except where Remarks note known SPA/UI engineering risks.

---

## Section 2: WCAG 2.1 Level A and AA tables

### How to read conformance columns

**Conformance:** **Supports**, **Partially Supports**, **Does Not Support**, **Not Applicable**, or **Not Evaluated** per ITI VPAT usage.

### Remarks shorthand

- **Automated CI (full sentence)** — Criteria marked **Supports** use this exact remark: "Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration)."
- **Partially Supports** may still acknowledge axe-core regressions observed in CI, but automation alone is **not** treated as conformance for those criteria unless **Supports** is claimed.

### Principle 1: Perceivable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 1.1.1 Non-text Content | A | Not Evaluated | Manual evaluation pending. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not Applicable | Operator UI assessed as **documentation and application chrome**, not packaged as multimedia player product; reassess when embedded prerecorded media ships. |
| 1.2.2 Captions (Prerecorded) | A | Not Applicable | Same applicability note as **1.2.1** for assessed scope. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not Applicable | Same applicability note as **1.2.1** for assessed scope. |
| 1.2.4 Captions (Live) | AA | Not Evaluated | Manual evaluation pending. |
| 1.2.5 Audio Description (Prerecorded) | AA | Not Evaluated | Manual evaluation pending. |
| 1.3.1 Info and Relationships | A | Partially Supports | Axe helps for labels/landmarks/structure; dense dashboards still need broader manual review. SPA/widget caveats. Supplemental axe-core CI signal only. |
| 1.3.2 Meaningful Sequence | A | Partially Supports | DOM order partly covered via automation where rules apply; responsive reading-order review still manual evaluation pending. |
| 1.3.3 Sensory Characteristics | A | Not Evaluated | Manual evaluation pending. |
| 1.3.4 Orientation | AA | Partially Supports | Responsive layout patterns; axe does not certify "no orientation lock" for every view; manual evaluation pending. |
| 1.3.5 Identify Input Purpose | AA | Not Evaluated | Manual evaluation pending. |
| 1.4.1 Use of Color | A | Partially Supports | Color conveys meaning in some statuses; axe heuristics are incomplete — supplemental axe-core CI only; manual evaluation pending. |
| 1.4.2 Audio Control | A | Not Applicable | No standard auto-playing narration in assessed chrome (revisit when media embeds arrive). |
| 1.4.3 Contrast (Minimum) | AA | Supports | Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration). |
| 1.4.4 Resize text | AA | Partially Supports | Responsive CSS; zoom-to-200% matrix per dialog/table not exhaustively exercised — manual evaluation pending. |
| 1.4.5 Images of Text | AA | Not Evaluated | Manual evaluation pending. |
| 1.4.10 Reflow | AA | Partially Supports | Responsive patterns; automated reflow tagging is indicative, not complete for every breakpoint — manual evaluation pending. |
| 1.4.11 Non-text Contrast | AA | Supports | Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration). |
| 1.4.12 Text Spacing | AA | Not Evaluated | Manual evaluation pending. |
| 1.4.13 Content on Hover or Focus | AA | Not Evaluated | Manual evaluation pending. |

### Principle 2: Operable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 2.1.1 Keyboard | A | Not Evaluated | Manual evaluation pending. |
| 2.1.2 No Keyboard Trap | A | Partially Supports | SPA/portals and modal stacks can trap focus in edge layouts; systematic manual verification still pending. |
| 2.1.4 Character Key Shortcuts | A | Not Evaluated | Manual evaluation pending. |
| 2.2.1 Timing Adjustable | A | Not Evaluated | Manual evaluation pending. |
| 2.2.2 Pause, Stop, Hide | A | Not Evaluated | Manual evaluation pending. |
| 2.3.1 Three Flashes or Below Threshold | A | Not Evaluated | Manual evaluation pending. |
| 2.4.1 Bypass Blocks | A | Partially Supports | Skip links/landmarks where implemented; axe flags some structural misses; remaining templates manual evaluation pending. |
| 2.4.2 Page Titled | A | Supports | Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration). |
| 2.4.3 Focus Order | A | Partially Supports | Client-side route transitions and portaled UI can reorder tab order relative to DOM; manual audit still pending despite engineering mitigations. |
| 2.4.4 Link Purpose (In Context) | A | Partially Supports | Link naming partially covered by axe; dense tables/menus need manual verification (manual evaluation pending). |
| 2.4.5 Multiple Ways | AA | Not Evaluated | Manual evaluation pending. |
| 2.4.6 Headings and Labels | AA | Partially Supports | Heading/label rules run in axe; nested layouts/custom controls manual evaluation pending. |
| 2.4.7 Focus Visible | AA | Partially Supports | Custom themes may suppress rings; axe cannot certify every hover/focus state — manual evaluation pending. |
| 2.5.1 Pointer Gestures | A | Not Evaluated | Manual evaluation pending. |
| 2.5.2 Pointer Cancellation | A | Not Evaluated | Manual evaluation pending. |
| 2.5.3 Label in Name | A | Partially Supports | Accessible-name checks partly automated; audible label vs visible text parity manual evaluation pending. |
| 2.5.4 Motion Actuation | A | Not Evaluated | Manual evaluation pending. |

### Principle 3: Understandable

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 3.1.1 Language of Page | A | Supports | Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration). |
| 3.1.2 Language of Parts | AA | Not Evaluated | Manual evaluation pending. |
| 3.2.1 On Focus | A | Partially Supports | SPA routing may change context on focus unexpectedly in edge flows — manual regression review pending. |
| 3.2.2 On Input | A | Partially Supports | Form + router interactions vary by workflow; exhaustive manual sweep pending. |
| 3.2.3 Consistent Navigation | AA | Partially Supports | Navigation shell intentionally consistent by design; exhaustive route/feature-flag permutation review manual evaluation pending. |
| 3.2.4 Consistent Identification | AA | Partially Supports | Design-system reuse lowers duplicate-control risk; repeated icon-only surfaces still need manual review. |
| 3.3.1 Error Identification | A | Partially Supports | Error presentation varies across forms; axe coverage partial — manual verification pending across edge cases. |
| 3.3.2 Labels or Instructions | A | Partially Supports | Label rules exercised in axe component/e2e runs; wizard complexity still manual verification pending. |
| 3.3.3 Error Suggestion | AA | Not Evaluated | Manual evaluation pending. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Not Evaluated | Manual evaluation pending. |

### Principle 4: Robust

| Criteria | Level | Conformance | Remarks and explanations |
| -------- | ----- | ----------- | ------------------------ |
| 4.1.1 Parsing | A | Partially Supports | Axe detects duplicate IDs and selected markup pitfalls; WCAG Parsing expectations beyond those checks — manual verification pending. |
| 4.1.2 Name, Role, Value | A | Partially Supports | Automated checks catch frequent ARIA/DOM regressions; bespoke widgets/canvases need manual assistive-tech validation. |
| 4.1.3 Status Messages | AA | Not Evaluated | Manual evaluation pending. |

---

## Notes and legal qualifier

Live-region coverage across asynchronous updates is not uniformly catalogued in this draft. Procurement teams evaluating regulated deployments should combine this report with criterion-level manual conformance evidence once reviews close.

Except where **Supports** repeats the automated CI sentence verbatim, statements should be read as contingent on unfinished manual conformance work.
