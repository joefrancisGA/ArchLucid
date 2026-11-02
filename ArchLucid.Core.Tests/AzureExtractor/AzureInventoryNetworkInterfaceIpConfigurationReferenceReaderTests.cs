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
}
