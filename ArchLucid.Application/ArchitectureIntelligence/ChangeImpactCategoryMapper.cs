using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ChangeImpactCategoryMapper
{
    internal static ChangeImpactCategory FromElementKind(ArchitectureElementKind kind)
    {
        return kind switch
        {
            ArchitectureElementKind.Decision => ChangeImpactCategory.Decision,
            ArchitectureElementKind.Risk => ChangeImpactCategory.Risk,
            ArchitectureElementKind.ComplianceObligation => ChangeImpactCategory.ComplianceMapping,
            ArchitectureElementKind.DeploymentTopology => ChangeImpactCategory.DeploymentDiagram,
            _ => ChangeImpactCategory.RelatedElement,
        };
    }
}
