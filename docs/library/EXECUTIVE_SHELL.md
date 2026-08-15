> **Scope:** ArchLucid sponsor shell (UI) — audience: architects, sponsors, product, and contributors maintaining the architect workspace; describes what the sponsor route group is for and what it is *not* (no new API surface).

# Sponsor shell (architect workspace)

**What:** Sponsor-facing reading surfaces under [`archlucid-ui/src/app/(operator)/insights/sponsor-summary/`](../../archlucid-ui/src/app/(operator)/insights/sponsor-summary/) and related sponsor dashboard routes — minimal chrome, optimized for sponsor and CTO-style portfolio reading.

**Entry points:**

- Direct: `/sponsor/scorecard` (tenant scorecard).
- Architecture package sponsor summary: `/reviews/{runId}` in the architect workspace (legacy `/sponsor/reviews/*` URLs redirect here).

**Auth:** Same JWT / API-key session as the architect workspace (`AuthPanel` in header). No anonymous or token-based sharing in V1; shareable links are a V1.1+ topic.

**Reuse:** [`ExecutiveShellFrame`](../../archlucid-ui/src/components/ExecutiveShellFrame.tsx), [`FindingInspectFindingBody`](../../archlucid-ui/src/app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx) (`variant="detail"`), severity helpers in [`sponsor-finding-severity.ts`](../../archlucid-ui/src/lib/sponsor/sponsor-finding-severity.ts).

**Related:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) (Pilot vs Operate; sponsor view is a read-mostly slice for sponsors), [V1_SCOPE.md](V1_SCOPE.md).
