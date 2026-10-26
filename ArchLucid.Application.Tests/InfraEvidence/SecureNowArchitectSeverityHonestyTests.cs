using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecureNowArchitectSeverityHonestyTests
{
    [Fact]
    public void CapabilityToFlowSeverityTable_uses_business_criticality_not_stored_label()
    {
        PrivilegePathSeverityResult result = CapabilityToFlowSeverityTable.Resolve(
            new CapabilityToFlowCandidate
            {
                Hops = [],
                HasInsufficientEvidenceHop = false,
            });

        result.BusinessCriticality.Should().Be(FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel);
    }

    [Fact]
    public void SharedControlBlastRadiusSeverityTable_uses_not_measured_blast_radius()
    {
        PrivilegePathSeverityResult result = SharedControlBlastRadiusSeverityTable.Resolve(
            new SharedControlBlastRadiusCandidate
            {
                DependentCount = 3,
                ControlNodeId = "/providers/Microsoft.KeyVault/vaults/kv",
                ControlKind = SharedControlBlastRadiusControlKind.CentralKeyVault,
            });

        result.BlastRadius.Should().Be(FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel);
        result.BusinessCriticality.Should().Be(FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel);
    }

    [Fact]
    public void CapabilityToFlowNarrative_uses_node_name_not_stored_for_blank_segment()
    {
        string title = CapabilityToFlowNarrative.BuildTitle(
            new CapabilityToFlowCandidate
            {
                WorkloadIdentityNodeId = "/subscriptions/sub/resourceGroups/rg/providers//",
                TerminalResourceType = "sql",
                DataAssetNodeId = "asset",
                Hops = [],
            });

        title.Should().Contain(FourRealityDriftNarrative.NodeNameNotStoredLabel);
    }
}
