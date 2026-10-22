> **Scope:** Contributor-reference — V1.1 backlog item TB-401 (progressive disclosure Batch 3, run-detail IA refactor).
> **Reviewed:** 2026-07-23

## TB-401

**Quality:** Adoption friction
**Area:** Architect workspace (`archlucid-ui/src/app/(operator)/reviews/[runId]`)
**Description:** Progressive disclosure Batch 3 (Run-detail IA refactor). The run detail page is a very long vertical stack. Batch 1 folded technical forensics into a default-closed accordion, which solved the worst of the cognitive load for V1. For V1.1, restructure the page into a true Primary vs. Secondary layout (e.g., two-column grid on desktop, or a tabbed interface) so the Sponsor-readable summary, Next best action, and Findings are the undeniable focal points, while banners, CTAs, and metadata cards move to a sidebar or secondary tab.
**Why deferred:** Batch 1 and 2 solved the V1 cognitive load blockers. A full IA refactor of the most complex page requires design decisions (responsive layout, sticky TOC behavior) that yield diminishing returns for V1 pilots compared to other priorities.
**Window:** V1.1
