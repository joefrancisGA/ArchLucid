using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfExternalSourceNodeFactoryTests
{
    private const string FactoryId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

    [Fact]
    public void BuildNodeKey_is_factory_scoped_and_stable()
    {
        string first = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(FactoryId, "SapLS");
        string second = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(FactoryId, "SapLS");

        first.Should().Be(second);
        first.Should().StartWith(AzureInventoryAdfExternalSourceNodeFactory.NodeKeyPrefix);
        first.Should().Contain("|SapLS");
    }

    [Fact]
    public void BuildDisplayLabel_uses_type_and_host()
    {
        AzureInventoryAdfExternalSourceNodeFactory.BuildDisplayLabel("SapTable", "sap.example.com")
            .Should()
            .Be("SapTable (sap.example.com)");
    }

    [Fact]
    public void BuildDisplayLabel_falls_back_when_type_missing()
    {
        AzureInventoryAdfExternalSourceNodeFactory.BuildDisplayLabel(null, "sap.example.com")
            .Should()
            .Be("External source (sap.example.com)");
    }

    [Fact]
    public void Two_factories_with_same_linked_service_name_produce_two_node_keys()
    {
        const string otherFactoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf2";

        string first = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(FactoryId, "SapLS");
        string second = AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(otherFactoryId, "SapLS");

        first.Should().NotBe(second);
    }

    [Fact]
    public void TryResolveExternalTargetArmId_returns_false_for_collection_failed_rows()
    {
        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId = FactoryId,
            LinkedServiceName = "_collection_failed",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved,
        };

        AzureInventoryAdfExternalSourceNodeFactory.TryResolveExternalTargetArmId(row, out string _)
            .Should()
            .BeFalse();
    }
}
