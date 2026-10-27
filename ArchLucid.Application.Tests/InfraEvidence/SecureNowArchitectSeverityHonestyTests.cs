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

    [Fact]
    public void CapabilityToFlowNarrative_uses_possible_access_wording_and_honest_egress_copy()
    {
        string title = CapabilityToFlowNarrative.BuildTitle(
            new CapabilityToFlowCandidate
            {
                WorkloadIdentityNodeId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                TerminalResourceType = "sql",
                DataAssetNodeId = "asset-db",
                Hops = [],
            });

        string description = CapabilityToFlowNarrative.BuildDescription(
            new CapabilityToFlowCandidate
            {
                WorkloadIdentityNodeId = "vm1",
                TerminalResourceType = "sql",
                DataAssetNodeId = "asset-db",
                Hops = [],
                HasUnrestrictedEgressHop = false,
            });

        title.Should().Contain("possible access");
        title.Should().NotContain(" may access ");
        description.Should().Contain("was not stored on this trace");
        description.Should().NotContain("not fully verified");
    }
}
