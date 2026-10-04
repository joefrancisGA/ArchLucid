using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryComputeIdentityPrincipalIndexTests
{
    [Fact]
    public void BuildPrincipalToComputeArmIds_reads_camel_case_identity_json()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = vmArmId,
                ResourceType = "Microsoft.Compute/virtualMachines",
                Name = "vm1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["identity"] = """{"principalId":"11111111-1111-1111-1111-111111111111","type":"SystemAssigned"}""",
                },
            },
        ];

        Dictionary<string, List<string>> index =
            AzureInventoryComputeIdentityPrincipalIndex.BuildPrincipalToComputeArmIds(resources);

        index.Should().ContainKey("11111111-1111-1111-1111-111111111111");
        index["11111111-1111-1111-1111-111111111111"].Should()
            .Contain(ArmResourceIdNormalizer.Normalize(vmArmId));
    }

    [Fact]
    public void BuildPrincipalToComputeArmIds_ignores_pascal_case_principal_id_property()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = vmArmId,
                ResourceType = "Microsoft.Compute/virtualMachines",
                Name = "vm1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["identity"] = """{"PrincipalId":"11111111-1111-1111-1111-111111111111","type":"SystemAssigned"}""",
                },
            },
        ];

        Dictionary<string, List<string>> index =
            AzureInventoryComputeIdentityPrincipalIndex.BuildPrincipalToComputeArmIds(resources);

        index.Should().BeEmpty();
    }
}
