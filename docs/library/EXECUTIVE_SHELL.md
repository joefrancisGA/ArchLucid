> **Scope:** ArchLucid executive shell (UI) — audience: operators, sponsors, product, and contributors maintaining the operator UI; describes what the executive route group is for and what it is *not* (no new API surface).

# Executive shell (operator UI)

**What:** A minimal Next.js route group under [`archlucid-ui/src/app/(executive)/`](../../archlucid-ui/src/app/(executive)/) with no sidebar — optimized for sponsor and CTO-style reading: finalized reviews, prioritized findings, finding detail, and DOCX export via existing REST endpoints.

**Entry points:**

- Direct: `/executive/reviews` (list), `/executive/reviews/{runId}` (findings board), `/executive/reviews/{runId}/findings/{findingId}` (detail).
- From operator shell: review detail **Actions** includes **Open executive view** when a golden manifest exists (`manifestId`).

**Auth:** Same JWT / API-key session as the operator shell (`AuthPanel` in header). No anonymous or token-based sharing in V1; shareable links are a V1.1+ topic.

**Reuse:** [`ExecutiveShellFrame`](../../archlucid-ui/src/components/ExecutiveShellFrame.tsx), [`FindingInspectFindingBody`](../../archlucid-ui/src/app/(operator)/runs/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx) (`variant="detail"`), severity helpers in [`executive-finding-severity.ts`](../../archlucid-ui/src/lib/executive-finding-severity.ts).

**Related:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) (Pilot vs Operate; executive view is a read-mostly slice for sponsors), [V1_SCOPE.md](V1_SCOPE.md).
