> **Scope:** ArchLucid executive shell (UI) — audience: architects, sponsors, product, and contributors maintaining the architect workspace; describes what the executive route group is for and what it is *not* (no new API surface).

# Executive shell (architect workspace)

**What:** A minimal Next.js route group under [`archlucid-ui/src/app/(executive)/`](../../archlucid-ui/src/app/(executive)/) with no sidebar — optimized for sponsor and CTO-style reading of portfolio scorecard surfaces.

**Entry points:**

- Direct: `/executive/scorecard` (tenant scorecard).
- Architecture package executive summary: `/reviews/{runId}` in the architect workspace (legacy `/executive/reviews/*` URLs redirect here).

**Auth:** Same JWT / API-key session as the architect workspace (`AuthPanel` in header). No anonymous or token-based sharing in V1; shareable links are a V1.1+ topic.

**Reuse:** [`ExecutiveShellFrame`](../../archlucid-ui/src/components/ExecutiveShellFrame.tsx), [`FindingInspectFindingBody`](../../archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx) (`variant="detail"`), severity helpers in [`executive-finding-severity.ts`](../../archlucid-ui/src/lib/executive-finding-severity.ts).

**Related:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) (Pilot vs Operate; executive view is a read-mostly slice for sponsors), [V1_SCOPE.md](V1_SCOPE.md).
