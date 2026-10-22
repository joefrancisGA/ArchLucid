using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Element kinds that can project from κ into Γ.
/// </summary>
public static class ArchitectureKnowledgeModelProjectableElements
{
    public static bool HasAny(ArchitectureKnowledgeModel? model)
    {
        if (model?.Elements is null)
            return false;

        return model.Elements.Any(static element =>
            element.Kind is ArchitectureElementKind.Component
                or ArchitectureElementKind.Interface
                or ArchitectureElementKind.DataFlow
                or ArchitectureElementKind.TrustBoundary
                or ArchitectureElementKind.DeploymentTopology
                or ArchitectureElementKind.ComplianceObligation
                or ArchitectureElementKind.FunctionalRequirement);
    }
}
