using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNetworkInterfaceIpConfigurationReferenceReaderTests
{
    [Fact]
    public void TryReadArmId_reads_flat_string_when_value_is_percent_encoded_plain_arm_scalar()
    {
        const string plainId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";
        string encodedId = Uri.EscapeDataString(plainId);

        using JsonDocument document = JsonDocument.Parse($"\"{encodedId}\"");

        string? armId = AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(document.RootElement);

        armId.Should().Be(ArmResourceIdNormalizer.Normalize(plainId));
    }

    [Fact]
    public void TryReadArmId_reads_nested_id_when_value_is_percent_encoded_plain_arm_scalar()
    {
        const string plainId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";
        string encodedId = Uri.EscapeDataString(plainId);

        using JsonDocument document = JsonDocument.Parse($$"""{"id":"{{encodedId}}"}""");

        string? armId = AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(document.RootElement);

        armId.Should().Be(ArmResourceIdNormalizer.Normalize(plainId));
    }

    [Fact]
    public void TryReadArmId_keeps_raw_value_when_percent_escape_is_malformed()
    {
        const string rawId =
            "/subscriptions/sub/resourceGroups/rg%ZZ/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";

        using JsonDocument document = JsonDocument.Parse($"\"{rawId}\"");

        string? armId = AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(document.RootElement);

        armId.Should().Be(ArmResourceIdNormalizer.Normalize(rawId));
    }

    [Fact]
    public void TryReadArmId_reads_id_from_a_json_object_carried_in_a_string()
    {
        const string plainId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{"id":"{{plainId}}"}""");

        AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(document.RootElement)
            .Should().Be(ArmResourceIdNormalizer.Normalize(plainId));
    }

    [Fact]
    public void TryReadArmId_reads_id_from_a_percent_encoded_json_object_carried_in_a_string()
    {
        const string plainId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1/ipConfigurations/ipconfig1";
        string encodedJson = Uri.EscapeDataString($$"""{"id":"{{plainId}}"}""");

        using JsonDocument document = JsonDocument.Parse($"\"{encodedJson}\"");

        AzureInventoryNetworkInterfaceIpConfigurationReferenceReader.TryReadArmId(document.RootElement)
            .Should().Be(ArmResourceIdNormalizer.Normalize(plainId));
    }
}
