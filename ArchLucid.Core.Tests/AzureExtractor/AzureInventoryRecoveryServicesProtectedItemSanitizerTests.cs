using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryRecoveryServicesProtectedItemSanitizerTests
{
    private const string VaultId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/asr-vault";

    private const string VmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";

    [Fact]
    public void TrySanitizeReplicationItem_reads_current_recovery_fabric_location()
    {
        using JsonDocument document = JsonDocument.Parse(
            $$"""
            {
              "properties": {
                "providerSpecificDetails": {
                  "instanceType": "A2A",
                  "fabricObjectId": "{{VmId}}",
                  "recoveryFabricLocation": "westus",
                  "initialRecoveryFabricLocation": "eastus"
                }
              }
            }
            """);

        bool parsed = AzureInventoryRecoveryServicesProtectedItemSanitizer.TrySanitizeReplicationItem(
            VaultId,
            document.RootElement,
            out AzureInventoryRecoveryServicesProtectedItemRow? row);

        parsed.Should().BeTrue();
        row.Should().NotBeNull();
        row!.SourceResourceId.Should().Be(VmId);
        row.ItemKind.Should().Be(AzureInventoryRecoveryServices.ReplicationItemKind);
        row.TargetRegion.Should().Be("westus");
    }
}
