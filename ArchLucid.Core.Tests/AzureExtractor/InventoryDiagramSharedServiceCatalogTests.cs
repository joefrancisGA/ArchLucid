using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

public sealed class InventoryDiagramSharedServiceCatalogTests
{
    [Fact]
    public void IsSharedService_returns_true_only_for_catalog_types()
    {
        InventoryDiagramSharedServiceCatalog.IsSharedService("Microsoft.OperationalInsights/workspaces")
            .Should().BeTrue();
        InventoryDiagramSharedServiceCatalog.IsSharedService("Microsoft.KeyVault/vaults")
            .Should().BeFalse();
        InventoryDiagramSharedServiceCatalog.IsSharedService("Microsoft.RecoveryServices/vaults")
            .Should().BeFalse();
        InventoryDiagramSharedServiceCatalog.IsSharedService("Microsoft.Storage/storageAccounts")
            .Should().BeFalse();
    }
}
