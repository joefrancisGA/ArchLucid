> **Scope:** Owner/operator-reported production defect intake — investigation-first triage register. Distinct from `TECH_BACKLOG.md`, which holds items whose scope and fix approach are already decided. A defect only becomes a `TB-###` backlog item once investigation confirms it is genuinely unfixed on `master` and not already fixed on some other branch.

# Production defect log

**Updated:** 2026-07-15 (**PD-001** logged — home architecture-workflow disclosure title not a link).

## How this differs from the technical backlog

| | `PRODUCTION_DEFECT_LOG.md` (this file) | `TECH_BACKLOG.md` |
| --- | --- | --- |
| Entry point | A raw "this broke in production" report, before anyone knows the cause | A scoped item where root cause + fix approach are already known |
| First status | Always **Investigating** | Never — items only land here once actionable |
| Closes by | Resolving to exactly one disposition (below) | Marking **Done** with implementation evidence |

Every `PD-###` entry resolves to exactly one disposition:

- **Verified fixed on `master`** — no code change needed; cite the commit/PR that already fixed it.
- **Fixed on branch `<branch>`, not merged** — a fix exists but hasn't reached `master`; cite branch + commit SHA.
- **Escalated to TB-###** — confirmed still broken; a technical backlog item was opened, and (unless the reporter asked only to log/investigate) implemented — see the linked `## TB-###` section in `TECH_BACKLOG.md`.
- **Cannot reproduce** — investigation found no supporting evidence in code, tests, or logs; lists exactly what repro detail is still needed.

**Never** mark a disposition without concrete evidence (a commit SHA, file:line reference, or test name). If the evidence is inconclusive, prefer **Escalated to TB-###** over **Verified fixed** — a false "already fixed" silently hides a live defect.

## ID scheme

**`PD-###`**, assigned sequentially from the highest existing ID in this file, never reused. Use **`/al-defect`** (`.cursor/commands/al-defect.md`) to log and investigate new reports — do not hand-edit this file for new entries.

## Summary table

| ID | Reported | Status | Title | Disposition |
| --- | --- | --- | --- | --- |
| PD-001 | 2026-07-15 | Escalated to TB-866 — Done | Home “Learn the architecture workflow” title not a link | Escalated to TB-866 |

---

## Per-defect detail

<!-- /al-defect appends one "## PD-###" section below this line per report. Do not reorder existing sections. -->

## PD-001 — Home architecture-workflow card title is not the workflow link

- **Reported:** 2026-07-15
- **Target branch:** `RC10` (reporter arg `RC-10`)
- **Reporter context:** route `/` (operator home); env production (assumed); tenant/workspace not specified
- **Description:** On the home page there is a hero card for “Learn the Architecture Workflow”. If you expand the hero card, it just provides you a link to “view workflow”. I think it would be more effective if the hero card title was the link.
- **Screenshot:** none provided
- **Status:** Escalated to TB-866 — Done
- **Investigation:** Confirmed on current code. Buyer-polished home renders `OperatorHomeAdvancedGuidanceSection` with title `OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE` (“Learn the architecture workflow”) as plain `OperatorHomeCardSectionTitle` text inside a disclosure; the only navigation affordance is the expanded-body CTA `OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA` (“View workflow”) → `/help/core-pilot` via `ExploreArchLucidWalkthroughRow`. Title is not a link on `master` or `RC10` prior to TB-866.
- **Disposition evidence:** TB-866 makes the disclosure title a link to the same workflow href when `buyerPolishedShell` is true; Vitest asserts the heading link.
