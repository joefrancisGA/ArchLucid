# Implementation Prompt: Confidence Intervals for Projected Cost Savings

**Objective:**
Enhance the reliability of ROI projections by adding a confidence interval to `CostConstraintFindingPayload` and requiring explicit human validation for high-uncertainty estimates before they are aggregated into the baseline Executive ROI dashboards.

**Context:**
Currently, `CostConstraintFindingPayload` captures a single point-estimate `ProjectedImpactUsd`. LLM cost hallucination is a known risk. By modeling an explicit confidence interval and surfacing it in the Operator UI, we prevent absurd hallucinations from destroying the product's credibility with executive sponsors.

**Steps to Implement:**

### 1. Update the Payload Contract
*   **File:** `ArchLucid.Contracts/Findings/Payloads/CostConstraintFindingPayload.cs`
*   **Action:** Add the following properties:
    *   `public decimal? ProjectedImpactUsdLowerBound { get; set; }`
    *   `public decimal? ProjectedImpactUsdUpperBound { get; set; }`
    *   `public string? ConfidenceReasoning { get; set; }`

### 2. Update Finding Schema Migration
*   **File:** `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.cs` (and any related migration code)
*   **Action:** Ensure the new bounds and reasoning fields are serialized and deserialized correctly into the payload.

### 3. Update the LLM Finding Engine Prompts
*   **File:** `ArchLucid.Capabilities.Cost/CostConstraintFindingEngine.cs` (or the relevant prompt resource)
*   **Action:** Instruct the LLM to output a `ProjectedImpactUsdLowerBound`, `ProjectedImpactUsdUpperBound`, and `ConfidenceReasoning` alongside `MaxMonthlyCost`/`ProjectedImpactUsd` for cost findings. Emphasize realistic bounding.

### 4. Update ROI Calculators
*   **Files:** `ArchLucid.Application/Roi/TenantAdjustedFindingsSavingsCalculator.cs` and `DispositionAwareRoiBasisCalculator.cs`
*   **Action:** If a lower/upper bound exists, consider logging or tracking variance. For V1.1, continuing to use the point estimate `ProjectedImpactUsd` for the primary sum is acceptable, but ensure the bounds pass through the ROI models if needed by the frontend.

### 5. Update Frontend Contracts
*   **Action:** Run `npm run generate:api-types` in `archlucid-ui` to sync the updated payload fields (assuming `CostConstraintFindingPayload` is exported to the OpenAPI spec).

### 6. Surface Bounds in Operator UI
*   **File:** `archlucid-ui/src/components/FindingsWhatIfAnalysisPanel.tsx` (and related finding detail views).
*   **Action:** When displaying cost findings, if bounds are present, display them alongside the point estimate (e.g., "$1,200 (Range: $800 - $1,500)").
*   **Action:** Display the `ConfidenceReasoning` in the cost analysis or finding detail section as a tooltip or secondary text.

**Important Guidelines:**
*   Ensure backwards compatibility. Existing findings without bounds should still parse successfully (the bounds are nullable).
*   Run `dotnet build ArchLucid.Backend.slnf` to ensure no C# compiler errors.
*   Update Golden Corpus JSON expectations if necessary (`tests/golden-corpus/decisioning/*`).
