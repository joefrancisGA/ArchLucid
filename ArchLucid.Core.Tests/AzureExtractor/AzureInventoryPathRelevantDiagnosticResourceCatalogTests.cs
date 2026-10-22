using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPathRelevantDiagnosticResourceCatalogTests
{
    [Theory]
    [InlineData("Microsoft.Storage/storageAccounts", true)]
    [InlineData("Microsoft.DataFactory/factories", true)]
    [InlineData("Microsoft.Synapse/workspaces", true)]
    [InlineData("Microsoft.EventHub/namespaces", true)]
    [InlineData("Microsoft.ServiceBus/namespaces", true)]
    [InlineData("Microsoft.Web/sites", true)]
    [InlineData("Microsoft.ContainerService/managedClusters", true)]
    [InlineData("Microsoft.DocumentDB/databaseAccounts", true)]
    [InlineData("Microsoft.Compute/virtualMachines", false)]
    [InlineData(null, false)]
    public void IsPathRelevant_matches_bounded_allow_list(string? resourceType, bool expected)
    {
        AzureInventoryPathRelevantDiagnosticResourceCatalog.IsPathRelevant(resourceType)
            .Should()
            .Be(expected);
    }
}
