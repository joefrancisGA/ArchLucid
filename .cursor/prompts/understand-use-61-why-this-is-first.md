# UU-61 — Why this finding is first

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-62 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-61**). **Depends on:** the persisted factor breakdown. Do not change the score.

## Goal

The priority-queue summary says why the finding is ranked here, in at most two short clauses. The machine line `Rule=IE15-priority-v1; Total=0.4200; Factors=11` stays available in the existing summary disclosure.

## Why

That machine line names the rule and counts inputs. A reader still cannot tell why the row is ahead of the next one. The contributions already live in `breakdownJson` on the ranked finding. The sentence is a reading of those contributions.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationPrioritization/RemediationRiskScoreEvaluator.cs` (`ExplanationSummary` format and `RemediationRiskFactorContribution`)
- `ArchLucid.Core/InfraEvidence/RemediationRiskFactor.cs`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityTable.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryTableSummaryCell.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the rendered priority queue)

## What to build

1. Branch `uu/61-why-this-is-first` from current `master`.
2. Add a pure UI helper that reads `breakdownJson` and returns the reader sentence. Do not change the stored `ExplanationSummary`. Do not call a model.
3. Eligible factors are contributions whose `NormalizedValue` is greater than 0 and whose `Source` is not `unknown` or `none`. Rank them by `WeightedContribution` descending. Break ties by the existing enum order in the JSON.
4. Take the first two. Map each factor to exactly one of these clauses:
   - InternetExposure: "Reachable from the internet"
   - KnownExploitation: "Known to be exploited"
   - Exploitability: "Practical to exploit"
   - Severity: "High severity"
   - IdentityControlPlaneImpact: "Affects identity or the control plane"
   - AssetCriticality: "Critical asset"
   - DataSensitivity: "Sensitive data"
   - BlastRadius: "Wide blast radius"
   - RemediationComplexity: "Hard to automate"
   - RemediationRisk: "No rollback recorded"
5. Join two clauses as "{first}. {second}." Join one clause as "{first}." When none qualify, use "This row does not name a leading factor."
6. When CompensatingControls has a negative `WeightedContribution`, append " An exception is already in force." Do not treat that factor as one of the two leading clauses.
7. The closed summary cell shows the reader sentence. The existing disclosure still shows the stored `ExplanationSummary` unchanged.
8. When `breakdownJson` is empty or not the contribution array, the cell shows "This row does not name a leading factor." and the disclosure still shows the stored summary.
9. Update the priority-queue test that expects the rule string in the closed cell. The closed cell expectation becomes the reader sentence. The disclosure expectation keeps the rule string.

## Acceptance criteria

- A breakdown led by InternetExposure and DataSensitivity shows "Reachable from the internet. Sensitive data."
- The stored summary still starts with `Rule=IE15-priority-v1`.
- An unknown-only breakdown shows "This row does not name a leading factor."
- No test expects the reader sentence to contain a decimal or a percent sign.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The clauses above are the exact strings.
- Do not change weights, rank order, or `RemediationRiskScoreEvaluator` summary format.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a helper test next to the new helper. Run that file too.

## Done when

Tests pass. Tell the owner to read the first closed summary cell and confirm it is two clauses, then open the disclosure and confirm the rule line is still there. Wait for that look before any commit.
