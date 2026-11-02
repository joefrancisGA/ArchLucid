using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryApplicationGatewayBackendAddressReaderTests
{
    [Fact]
    public void TryReadBackendResourceArmId_reads_resource_when_backend_resource_id_is_percent_encoded_plain_arm_scalar()
    {
        const string nicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        string encodedNicId = Uri.EscapeDataString(nicId);

        using JsonDocument document = JsonDocument.Parse($$"""
                                                            {
                                                              "properties": {
                                                                "backendResourceId": "{{encodedNicId}}"
                                                              }
                                                            }
                                                            """);

        string? armId = AzureInventoryApplicationGatewayBackendAddressReader.TryReadBackendResourceArmId(
            document.RootElement);

        armId.Should().Be(ArmResourceIdNormalizer.Normalize(nicId));
    }
}
