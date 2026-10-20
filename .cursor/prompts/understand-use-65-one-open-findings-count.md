# UU-65 — One open-findings count

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-66 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-65**). **Depends on:** the factory metrics grid that is actually rendered.

## Goal

The rendered metrics grid shows one Open findings number. Notes about the rule version and a second queue move into one closed disclosure.

## Why

The visible grid is `ExecutiveMetricsGrid` in `RemediationFactoryClient.tsx`, fed by `buildRemediationFactoryExecutiveMetricPresentations`. Its scope notes still say "factory metrics API", "IE15-priority-v1", and that the governance queue may differ. A second component, `RemediationFactoryExecutiveMetricsSection`, would also show two Open findings tiles. It is not mounted. Mounting it would put two counts on the page.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (`ExecutiveMetricsGrid`)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryExecutiveMetricsSection.tsx` (do not mount it)

## What to build

1. Branch `uu/65-one-open-findings-count` from current `master`.
2. Keep one tile labeled "Open findings". Keep its numeric value and its link.
3. Visible helpers, one each, when UU-41 has not already set them:
   - Open findings: "SecureNow findings that are still open."
   - Risk-weighted open: "A weighted count of those open findings. Not a percentage."
   - Critical exposure: "Open findings marked critical."
   - Net burn (7d): "Findings opened minus findings closed in seven days."
   - Pattern exact match: "Share of open findings whose pattern matched exactly."
   - Automation: "Share of open findings with an automated check."
   - Exceptions active: "Risk exceptions still in force."
   - Average age: "Average age of the open findings, in days."
4. If those exact sentences are already the visible helpers, keep them.
5. Remove "IE15-priority-v1", "factory metrics API", and "may differ" from the visible tile body.
6. Add one disclosure under the grid, closed by default, titled "How these counts are measured". Its body is exactly: "Open findings uses the factory metrics count. The governance queue can count open rows differently. Risk-weighted open uses remediation prioritization rule IE15-priority-v1. Net burn is opened minus closed. It is not cloud spend."
7. Do not import or render `RemediationFactoryExecutiveMetricsSection` on this page. Leave that file in place.
8. Do not add a tile. Do not change a measured value.

## Acceptance criteria

- The rendered grid has one "Open findings" tile.
- The rule version is absent from the tile body and present in the disclosure body.
- `RemediationFactoryExecutiveMetricsSection` is still unmounted from the factory page.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The disclosure title and body are exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation.test.ts" "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add the presentation test file if it does not exist. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read Open findings, then open How these counts are measured. Wait for that look before any commit.
