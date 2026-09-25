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
    public void Parse_without_source_returns_null()
    {
        AzureInventoryRestorePointCollectionSourceParser.Parse(new Dictionary<string, string>())
            .Should()
            .BeNull();
    }
}
