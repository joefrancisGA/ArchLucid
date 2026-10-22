using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDiffHeuristicsTests
{
    [Fact]
    public void ClassifyPropertyChange_public_network_access_maps_to_network_exposure()
    {
        AzureInventoryChangeType changeType = AzureInventoryDiffHeuristics.ClassifyPropertyChange(
            "enablePublicNetworkAccess",
            "false",
            "true",
            "Microsoft.Storage/storageAccounts");

        changeType.Should().Be(AzureInventoryChangeType.NetworkExposureChanged);
    }

    [Fact]
    public void IsElevatedRoleAssignment_detects_owner_role()
    {
        bool elevated = AzureInventoryDiffHeuristics.IsElevatedRoleAssignment(
            "/providers/Microsoft.Authorization/roleDefinitions/Owner");

        elevated.Should().BeTrue();
    }

    [Fact]
    public void IsLoggingRegression_true_when_workspace_removed()
    {
        bool regression = AzureInventoryDiffHeuristics.IsLoggingRegression(
            "workspaceId",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/log1",
            null);

        regression.Should().BeTrue();
    }
}
