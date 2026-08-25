using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureArmResourceCostMapperTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Microsoft.Network/virtualNetworks")]
    [InlineData("microsoft.insights/components")]
    public void TryInferPlatform_UnrecognizedOrBlankType_ReturnsNull(string? armResourceType)
    {
        AzureArmResourceCostMapper.TryInferPlatform(armResourceType).Should().BeNull();
    }

    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", RuntimePlatform.Vm)]
    [InlineData("  microsoft.compute/virtualmachines  ", RuntimePlatform.Vm)]
    [InlineData("Microsoft.Web/sites", RuntimePlatform.AppService)]
    [InlineData("Microsoft.Web/serverFarms", RuntimePlatform.AppService)]
    [InlineData("Microsoft.ContainerService/managedClusters", RuntimePlatform.Aks)]
    [InlineData("Microsoft.Sql/servers/databases", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Sql/servers/databases/extra-segment", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Sql/managedInstances", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Storage/storageAccounts", RuntimePlatform.BlobStorage)]
    [InlineData("Microsoft.Cache/redis", RuntimePlatform.Redis)]
    [InlineData("Microsoft.KeyVault/vaults", RuntimePlatform.KeyVault)]
    [InlineData("Microsoft.Search/searchServices", RuntimePlatform.AzureAiSearch)]
    [InlineData("Microsoft.CognitiveServices/accounts", RuntimePlatform.AzureOpenAi)]
    public void TryInferPlatform_RecognizedType_ReturnsCostingPlatform(
        string armResourceType,
        RuntimePlatform expected)
    {
        AzureArmResourceCostMapper.TryInferPlatform(armResourceType).Should().Be(expected);
    }
}
