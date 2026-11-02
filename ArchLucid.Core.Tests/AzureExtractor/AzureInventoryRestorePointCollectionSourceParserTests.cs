using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryRestorePointCollectionSourceParserTests
{
    private const string VirtualMachineArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";

    [Fact]
    public void Parse_source_id_property_returns_protected_vm_arm_id()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["source.id"] = VirtualMachineArmId,
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_arm_id_from_json_reference_on_source_id_property()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["source.id"] =
                """
                {"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app"}
                """,
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_source_from_json_blob_when_id_inside_is_percent_encoded_plain_arm_scalar()
    {
        string blob = $$"""{"id":"{{Uri.EscapeDataString(VirtualMachineArmId)}}"}""";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["source"] = blob,
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_id_from_raw_json_when_another_property_contains_percent_encoding()
    {
        string blob = $$"""{"id":"{{VirtualMachineArmId}}","tag":"a%22b"}""";

        AzureInventoryRestorePointCollectionSourceParser.Parse(
                new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["source"] = blob,
                })
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_id_from_a_fully_percent_encoded_json_blob()
    {
        string blob = Uri.EscapeDataString($$"""{"id":"{{VirtualMachineArmId}}"}""");

        AzureInventoryRestorePointCollectionSourceParser.Parse(
                new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["source"] = blob,
                })
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_hydrated_restore_point_source_when_value_is_percent_encoded_plain_arm_scalar()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] =
                Uri.EscapeDataString(VirtualMachineArmId),
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_source_id_when_value_is_percent_encoded_plain_arm_scalar()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["source.id"] = Uri.EscapeDataString(VirtualMachineArmId),
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_reads_source_id_when_value_is_double_percent_encoded_plain_arm_scalar()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["source.id"] = Uri.EscapeDataString(Uri.EscapeDataString(VirtualMachineArmId)),
        };

        AzureInventoryRestorePointCollectionSourceParser.Parse(properties)
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(VirtualMachineArmId));
    }

    [Fact]
    public void Parse_with_malformed_percent_encoding_does_not_throw()
    {
        string encoded = Uri.EscapeDataString(VirtualMachineArmId);

        Dictionary<string, string> malformedTailProperties = new(StringComparer.Ordinal)
        {
            ["source.id"] = encoded + "%zz",
        };

        Action actTail = () => AzureInventoryRestorePointCollectionSourceParser.Parse(malformedTailProperties);

        actTail.Should().NotThrow();

        Dictionary<string, string> malformedHexProperties = new(StringComparer.Ordinal)
        {
            ["source.id"] = "%zz" + encoded,
        };

        Action actHex = () => AzureInventoryRestorePointCollectionSourceParser.Parse(malformedHexProperties);

        actHex.Should().NotThrow();
        AzureInventoryRestorePointCollectionSourceParser.Parse(malformedHexProperties).Should().BeNull();
    }

    [Fact]
    public void Parse_without_source_returns_null()
    {
        AzureInventoryRestorePointCollectionSourceParser.Parse(new Dictionary<string, string>())
            .Should()
            .BeNull();
    }
}
