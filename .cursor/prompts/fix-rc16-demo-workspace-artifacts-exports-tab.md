# Fix: RC16 `@release-gate` demo-workspace smokes — `#artifacts-exports` never appears

**Target branch:** `RC16` (checkout this branch before changing anything — do not fix on `master` / another RC and port over).

**Failing specs (both `@release-gate`, chromium, 240s test timeout):**

1. `archlucid-ui/e2e/demo-workspace-a.smoke.spec.ts` — finalized record exports  
2. `archlucid-ui/e2e/demo-workspace-b.smoke.spec.ts` — Pack A/B + consulting DOCX + whitelabel export JSON  

**Shared stack:**

```
Error: locator.scrollIntoViewIfNeeded: Test timeout of 240000ms exceeded.
Call log:
  - waiting for locator('#artifacts-exports')

at helpers/operator-journey.ts:662
  await artifactsSection.scrollIntoViewIfNeeded();
at ensureBuyerDeliverablesSectionExpanded (…)
```

---

## Diagnosis (do not re-litigate — implement the fix)

This is **not** a seed/manifest flake and **not** a missing `id` on the section component.

### Product truth

| Fact | Source |
|------|--------|
| `#artifacts-exports` is rendered by `RunDetailArtifactsExportsSection` | `RunDetailArtifactsExportsSection.tsx` (`<section id="artifacts-exports">`) |
| On buyer-polished tabbed run detail, that section is **only** mounted in the **Evidence** panel | `RunDetailPageView.tsx` → `panels.evidence` includes `{artifactsExportsSectionEl}` |
| Inactive tabs **unmount** their panel DOM (`TabsContent` returns `null` when not selected) | `archlucid-ui/src/components/ui/tabs.tsx` (`if (!selected && !forceMount) return null`) |
| Legacy hash `#artifacts-exports` maps to tab **`evidence`** | `review-detail-workspace-tabs.ts` → `LEGACY_HASH_TO_TAB["artifacts-exports"] = "evidence"` |
| Product CTAs already deep-link to Evidence | `resolve-review-package-primary-action.ts` → `buildReviewDetailTabHref(runId, "evidence", { hash: "artifacts-exports" })` |

### Bug

`ensureBuyerDeliverablesSectionExpanded` in `archlucid-ui/e2e/helpers/operator-journey.ts` (~649–676) does the opposite of product truth:

1. Specs leave the page on a non-Evidence tab (`policies` in workspace-A; other tabs in workspace-B).
2. Helper sees `#artifacts-exports` missing/hidden (correct — Evidence panel unmounted).
3. Helper opens **`activity`** via `openReviewDetailWorkspaceTab(page, runId, "activity")` (and the no-`runId` branch clicks `review-detail-workspace-tab-activity`).
4. Activity panel never contains `#artifacts-exports`.
5. `scrollIntoViewIfNeeded()` waits until the **test** timeout (240s) — exact CI symptom.

`#pipeline-timeline` / Activity helpers correctly use `activity`. Deliverables must use **`evidence`**. Someone copy-pasted the Activity fallback into the Deliverables helper.

Secondary hardening gap (fix in the same change): after switching tabs, the helper does **not** re-wait for `#artifacts-exports` to be attached/visible before scrolling. Mirror the re-query pattern already used in `ensureBuyerExecutiveBriefingSectionExpanded` (re-assign locator after tab open).

---

## Fix (preferred — one helper, all callers)

### 1. Correct tab in `ensureBuyerDeliverablesSectionExpanded`

File: `archlucid-ui/e2e/helpers/operator-journey.ts`

When `#artifacts-exports` is absent or not visible:

- **With `runId`:** `await openReviewDetailWorkspaceTab(page, runId, "evidence");`
- **Without `runId`:** click `review-detail-workspace-tab-evidence` and wait for `reviewDetailWorkspacePanel(page, "evidence")`.

Prefer deriving the tab from product code to prevent drift:

```typescript
import { resolveReviewDetailTabFromHash } from "../../src/lib/review-detail-workspace-tabs";
// or the e2e-safe import path already used by this helper file for ReviewDetailTabId

const deliverablesTab = resolveReviewDetailTabFromHash("artifacts-exports") ?? "evidence";
```

Do **not** hardcode `"activity"` anywhere in this helper.

### 2. Wait after tab switch before scroll

After opening Evidence:

```typescript
const artifactsSection = page.locator("#artifacts-exports");
await expect(artifactsSection).toBeVisible({ timeout: 60_000 });
await artifactsSection.scrollIntoViewIfNeeded();
// …existing Deliverables <details> expand logic unchanged…
```

Re-query the locator after navigation (same pattern as `#sponsor-handoff` helper).

### 3. Do **not** weaken product assertions

Keep asserting:

- `#artifacts-exports` → link `/Download evidence bundle/i`
- `data-testid="golden-manifest-markdown-download-button"`

Do not skip Deliverables, do not forceMount Evidence for tests, do not raise the 240s timeout as the “fix”.

### 4. Optional audit (same PR if cheap)

Grep helpers for other “missing section → open activity” fallbacks that should follow `LEGACY_HASH_TO_TAB` instead. Fix only clear copy-paste mistakes that would cause the same class of failure. Leave `#pipeline-timeline` → Activity alone.

Call sites that benefit automatically (no spec rewrite required unless a call site itself navigates to the wrong tab before asserting):

- `demo-workspace-a.smoke.spec.ts`
- `demo-workspace-b.smoke.spec.ts`
- `live-api-whitelabel-export.spec.ts`
- `live-api-core-pilot-path.spec.ts`
- any other `ensureBuyerDeliverablesSectionExpanded` caller

---

## Reproduction / verification on `RC16`

From `archlucid-ui/` against the same live API + demo seed path CI uses (`LIVE_API_URL`, seeded Demo Workspace A/B):

```powershell
npm exec playwright test e2e/demo-workspace-a.smoke.spec.ts e2e/demo-workspace-b.smoke.spec.ts --project=chromium
```

Or tag filter:

```powershell
npm exec playwright test --grep "@release-gate" --project=chromium
```

If full live stack is unavailable locally, still:

1. Unit-check / code-review that the helper opens `evidence`.
2. Confirm `TabsContent` still unmounts inactive panels (so wrong-tab = missing id is still true).

---

## Acceptance

- [ ] `ensureBuyerDeliverablesSectionExpanded` opens **Evidence**, never Activity, when `#artifacts-exports` is missing.
- [ ] Helper waits for `#artifacts-exports` visible after tab switch before `scrollIntoViewIfNeeded`.
- [ ] `demo-workspace-a.smoke` and `demo-workspace-b.smoke` pass (no 240s `#artifacts-exports` wait).
- [ ] Existing Deliverables expand + evidence-bundle / markdown-download assertions remain.
- [ ] No product UI change required unless investigation proves Evidence panel fails to mount `#artifacts-exports` even when active **and** `manifestId` is present — that would be a separate product bug; default assumption is helper-only.

## Out of scope

- Seed / DbUp / demo workspace fixture changes
- Raising Playwright test timeouts
- `ensureBuyerExecutiveBriefingSectionExpanded` / Activity timeline helpers (unless you find the same wrong-tab copy-paste for a hash that maps elsewhere)
- SOC2 / pen-test / GTM cohort work

## Commit

Commit **on `RC16`** only when the user names that branch in the commit request. Message should name the root cause, e.g.:

```
fix(e2e): open Evidence tab before asserting #artifacts-exports on RC16

Buyer deliverables live on the Evidence workspace panel; the helper
incorrectly fell back to Activity after inactive tabs unmount the section.
```
