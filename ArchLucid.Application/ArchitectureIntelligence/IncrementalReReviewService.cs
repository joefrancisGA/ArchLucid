using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class IncrementalReReviewService : IIncrementalReReviewService
{
    public IncrementalReReviewResult ReReview(
        ArchitectureKnowledgeModel model,
        ReReviewScope scope,
        ISpecialistReviewService specialistService)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(specialistService);

        List<GlobalInvariantCheckResult> globalInvariantResults = RunGlobalInvariantChecks(model);
        bool fullReReviewTriggered = scope.FullReReview || scope.Trigger.HasValue;
        List<SpecialistReviewResult> specialistResults = [];

        if (fullReReviewTriggered)
        {
            specialistResults.Add(specialistService.Review(model));
        }
        else if (scope.AffectedElementIds.Count > 0)
        {
            specialistResults.Add(specialistService.Review(model));
        }

        return new IncrementalReReviewResult
        {
            Scope = scope,
            SpecialistResults = specialistResults,
            GlobalInvariantResults = globalInvariantResults,
            FullReReviewTriggered = fullReReviewTriggered,
        };
    }

    private static List<GlobalInvariantCheckResult> RunGlobalInvariantChecks(ArchitectureKnowledgeModel model)
    {
        return
        [
            EvaluateTenantIsolation(model),
            EvaluateDataResidency(model),
            EvaluateAuthentication(model),
        ];
    }

    private static GlobalInvariantCheckResult EvaluateTenantIsolation(ArchitectureKnowledgeModel model)
    {
        bool hasTenantSignal = model.Elements.Any(element =>
            element.Name.Contains("tenant", StringComparison.OrdinalIgnoreCase)
            || element.Properties.ContainsKey("tenantIsolation"));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-TENANT-ISOLATION",
            Passed = hasTenantSignal || model.Elements.Count == 0,
            Detail = hasTenantSignal
                ? "Tenant isolation related elements are present or indeterminate detail remains acceptable."
                : "No explicit tenant isolation elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateDataResidency(ArchitectureKnowledgeModel model)
    {
        bool hasResidencySignal = model.Elements.Any(element =>
            element.Kind == ArchitectureElementKind.ComplianceObligation
            || element.Kind == ArchitectureElementKind.DataFlow
            || element.Name.Contains("residency", StringComparison.OrdinalIgnoreCase));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-DATA-RESIDENCY",
            Passed = hasResidencySignal || model.Elements.Count == 0,
            Detail = hasResidencySignal
                ? "Data residency or compliance elements are present."
                : "No explicit data residency elements found; treated as indeterminate detail.",
        };
    }

    private static GlobalInvariantCheckResult EvaluateAuthentication(ArchitectureKnowledgeModel model)
    {
        bool hasAuthenticationSignal = model.Elements.Any(element =>
            element.Name.Contains("auth", StringComparison.OrdinalIgnoreCase)
            || element.Kind == ArchitectureElementKind.TrustBoundary
            || element.Properties.ContainsKey("authentication"));

        return new GlobalInvariantCheckResult
        {
            InvariantId = "INV-AUTHENTICATION",
            Passed = hasAuthenticationSignal || model.Elements.Count == 0,
            Detail = hasAuthenticationSignal
                ? "Authentication or trust boundary elements are present."
                : "No explicit authentication elements found; treated as indeterminate detail.",
        };
    }
}
