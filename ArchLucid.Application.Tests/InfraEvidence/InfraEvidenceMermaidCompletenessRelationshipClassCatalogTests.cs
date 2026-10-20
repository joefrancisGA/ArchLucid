using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceMermaidCompletenessRelationshipClassCatalogTests
{
    [Fact]
    public void WarningAppliesToMode_maps_ie_rf_codes_by_mode()
    {
        InfraEvidenceMermaidCompletenessRelationshipClassCatalog
            .WarningAppliesToMode("network", AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing)
            .Should()
            .BeTrue();
        InfraEvidenceMermaidCompletenessRelationshipClassCatalog
            .WarningAppliesToMode("identity", AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing)
            .Should()
            .BeFalse();
        InfraEvidenceMermaidCompletenessRelationshipClassCatalog
            .WarningAppliesToMode("dataFlow", AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ResolveClassLabel_maps_known_warning_codes()
    {
        InfraEvidenceMermaidCompletenessRelationshipClassCatalog
            .ResolveClassLabel(AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing)
            .Should()
            .Be("nicToSubnet");
    }
}
