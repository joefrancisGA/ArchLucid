using ArchLucid.Core.AzureExtractor;

using Xunit;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryAksWorkloadImageCollectionWarningsTests
{
    private const string ClusterId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks";

    [Fact]
    public void FormatCustomerScriptWarning_uses_reason_and_cluster_id()
    {
        string warning = AzureInventoryAksWorkloadImageCollectionWarnings.FormatCustomerScriptWarning(
            AzureInventoryAksWorkloadImageCollectionWarnings.ReasonInsufficientRbac,
            ClusterId);

        Assert.Equal(
            "aks-workload-images-not-collected-customer-script:insufficient-rbac:" + ClusterId,
            warning);
    }

    [Fact]
    public void TryParse_round_trips_structured_warning()
    {
        string warning = AzureInventoryAksWorkloadImageCollectionWarnings.FormatHostedWarning(
            AzureInventoryAksWorkloadImageCollectionWarnings.ReasonMissingLogs,
            ClusterId);

        bool parsed = AzureInventoryAksWorkloadImageCollectionWarnings.TryParse(
            warning,
            out string? captureBase,
            out string? reason,
            out string? clusterResourceId);

        Assert.True(parsed);
        Assert.Equal(AzureInventoryAksWorkloadImageCollectionWarnings.HostedBase, captureBase);
        Assert.Equal(AzureInventoryAksWorkloadImageCollectionWarnings.ReasonMissingLogs, reason);
        Assert.Equal(ClusterId, clusterResourceId);
    }

    [Fact]
    public void TryParse_legacy_base_code_without_cluster()
    {
        bool parsed = AzureInventoryAksWorkloadImageCollectionWarnings.TryParse(
            AzureInventoryAksWorkloadImageCollectionWarnings.CustomerScriptBase,
            out string? captureBase,
            out string? reason,
            out string? clusterResourceId);

        Assert.True(parsed);
        Assert.Equal(AzureInventoryAksWorkloadImageCollectionWarnings.CustomerScriptBase, captureBase);
        Assert.Equal(AzureInventoryAksWorkloadImageCollectionWarnings.ReasonUnavailable, reason);
        Assert.Null(clusterResourceId);
    }
}
