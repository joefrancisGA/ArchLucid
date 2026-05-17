> **Scope:** External (e.g., ChatGPT) UI assessment prompt — screenshot review for commercial demo credibility only; not product architecture or API contracts.

# OpenAI UI screenshot assessment prompt (ArchLucid)

Paste the block below as the user message when submitting a new batch of ArchLucid UI screenshots. Update the **Screenshot capture** subsection first so it matches how the batch was actually captured.

---

```text
Here is a new batch of ArchLucid UI screenshots for assessment.

## Context you must use before evaluating

**Screenshot capture (REQUIRED — edit per batch):**
- These screenshots were captured with the **buyer-oriented operator shell**: either public demo/static showcase build (`NEXT_PUBLIC_DEMO_MODE=true` or `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=1`), OR default shell with **`NEXT_PUBLIC_OPERATOR_EXPERIENCE` unset** (do not use `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` for commercial-readiness review — that is the dense internal layout). See `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`.
- Note: there is no separate `NEXT_PUBLIC_BUYER_POLISHED_SHELL` flag; buyer-oriented chrome follows the flags above and `archlucid-ui/src/lib/demo-ui-env.ts`.

**Sections that are intentionally collapsed, hidden, or filtered in this mode** are working as designed. Do not flag them as problems unless you can confirm they are **visible** in the screenshots.

**Target buyer:** Compliance-sensitive enterprise buyers in regulated industries (e.g., healthcare, financial services). They evaluate safety for CIO / procurement audiences. They are technically literate but not engineers. They care about risk posture, governance, evidence quality, and audit readiness — not pipeline internals unless clearly labeled optional.

**Intended demo path (golden path):** Home → Reviews list → Review detail → Executive view → Manifest summary → Evidence graph → Governance → Audit. Finding detail and Ask are secondary. Routes outside this list are **out of scope** for the demo unless they are **actively linked from within** the golden path.

**Route identity:** Three distinct finding-related surfaces exist:
- `/reviews/[id]` — full review package
- `/reviews/[id]/findings/[findingId]` — finding detail (severity, evidence, business impact)
- `/reviews/[id]/findings/[findingId]/inspect` — technical traceability

Do **not** flag these as routing bugs from visual similarity alone. If they show **near-identical narrative or empty differentiation**, call that a **data-seeding or content** gap, not a broken route.

---

## What to assess

List **every** issue you see, **uncapped**, sorted by severity. Do **not** pad the list to reach a target count (e.g., 100). Stop when genuine screenshot-visible concerns are exhausted.

Prioritize:
- **P0:** Demo blockers — broken rendering, misleading commercial claims, internal or harness language in buyer-facing copy, trust-harming inconsistencies
- **P1:** Commercial polish — terminology, buyer-path clarity, section framing, CTA labels, information hierarchy
- **P2:** Lower-priority visual or workflow polish

---

## What to focus on

- Copy that reads as internal tooling or test harness (e.g., “fixed pipeline replay,” “no live model calls,” “API unavailable,” “fallback”) when shown on a buyer path
- Raw IDs, run slugs, or system identifiers without a friendly name
- Golden-path pages that lead with technical content before business outcomes
- Inconsistent taxonomy across pages (finding vs. warning vs. gap vs. risk)
- CTAs whose label does not match buyer-expected outcomes
- Elements visible in **these** screenshots that should be collapsed or hidden for buyers (only if actually visible)

---

## What to avoid

- Flagging sections that are **not visible** (omitted, collapsed by default, or operator-only in the capture mode described above)
- Flagging routes outside the golden path unless reachable from it in the screenshots
- Inferring broken navigation from similarity alone — require wrong title, breadcrumb, or primary CTA as evidence
- Generic advice not tied to a specific visible control in this batch
- Items that only praise a screen unless that praise is required to explain an adjacent issue

---

## API / data concerns (separate section)

After the main list, add a clearly labeled short section for issues that might be **API down**, **empty seed data**, or **loader-only** states. De-prioritize those relative to fixable UI/copy issues.
```
