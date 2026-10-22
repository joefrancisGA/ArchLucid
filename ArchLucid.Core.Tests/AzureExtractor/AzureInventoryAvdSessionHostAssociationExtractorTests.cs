using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAvdSessionHostAssociationExtractorTests
{
    [Fact]
    public void TryExtractFromSessionHostId_returns_row_for_valid_ids()
    {
        const string sessionHostId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1";
        const string vmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-001";

        bool extracted = AzureInventoryAvdSessionHostAssociationExtractor.TryExtractFromSessionHostId(
            sessionHostId,
            vmId,
            out AzureInventoryAvdSessionHostAssociationRow? row);

        extracted.Should().BeTrue();
        row.Should().NotBeNull();
        row!.SessionHostResourceId.Should().Be(sessionHostId);
        row.VirtualMachineResourceId.Should().Be(vmId);
        row.AssociationType.Should().Be(AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm);
    }

    [Fact]
    public void TryExtractFromJsonElement_reads_properties_resourceId()
    {
        const string json = """
                            {
                              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/host1",
                              "properties": {
                                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-001"
                              }
                            }
                            """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool extracted = AzureInventoryAvdSessionHostAssociationExtractor.TryExtractFromJsonElement(
            document.RootElement,
            out AzureInventoryAvdSessionHostAssociationRow? row);

        extracted.Should().BeTrue();
        row!.AssociationType.Should().Be(AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm);
    }

    [Theory]
    [InlineData("", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1", "")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1")]
    public void TryExtractFromSessionHostId_rejects_invalid_ids(string sessionHostId, string vmId)
    {
        AzureInventoryAvdSessionHostAssociationExtractor.TryExtractFromSessionHostId(
                sessionHostId,
                vmId,
                out _)
            .Should()
            .BeFalse();
    }
}
