using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class AzureInventoryRuntimeIdentityReaderTests
{
    [Fact]
    public void HasRuntimeIdentity_is_false_when_the_site_has_no_identity()
    {
        AzureInventoryRuntimeIdentityReader.HasRuntimeIdentity(new Dictionary<string, string>()).Should().BeFalse();
    }

    [Fact]
    public void TryReadSystemAssignedPrincipalId_reads_the_top_level_principal()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["identity"] = """{"type":"SystemAssigned","principalId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}""",
        };

        AzureInventoryRuntimeIdentityReader.TryReadSystemAssignedPrincipalId(properties, out string principalId)
            .Should().BeTrue();
        principalId.Should().Be("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        AzureInventoryRuntimeIdentityReader.HasRuntimeIdentity(properties).Should().BeTrue();
    }

    [Fact]
    public void TryReadSystemAssignedPrincipalId_reads_pascal_case_principal_id_property()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["identity"] = """{"type":"SystemAssigned","PrincipalId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}""",
        };

        AzureInventoryRuntimeIdentityReader.TryReadSystemAssignedPrincipalId(properties, out string principalId)
            .Should().BeTrue();
        principalId.Should().Be("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        AzureInventoryRuntimeIdentityReader.HasRuntimeIdentity(properties).Should().BeTrue();
    }

    [Fact]
    public void HasUserAssignedIdentity_detects_a_nested_identity_resource()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["identity"] =
                """{"type":"UserAssigned","userAssignedIdentities":{"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker":{}}}""",
        };

        AzureInventoryRuntimeIdentityReader.HasUserAssignedIdentity(properties).Should().BeTrue();
        AzureInventoryRuntimeIdentityReader.TryReadSystemAssignedPrincipalId(properties, out _).Should().BeFalse();
    }
}
