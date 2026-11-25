using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryPublicNetworkAccessResolverTests
{
    [Fact]
    public void IsPublicNetworkAccessEnabled_accepts_storage_publicNetworkAccess_enabled()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicNetworkAccess"] = "Enabled",
        };

        Assert.True(AzureInventoryPublicNetworkAccessResolver.IsPublicNetworkAccessEnabled(properties));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Unknown")]
    [InlineData("Enabled")]
    public void IsPrivateEndpointOnlyExposure_requires_explicit_disablement(string? access)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["privateEndpointConnections"] = "[{}]",
        };
        if (access is not null)
            properties["publicNetworkAccess"] = access;
        Assert.False(AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(properties));
    }

    [Fact]
    public void IsPrivateEndpointOnlyExposure_requires_pe_without_public_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["privateEndpointConnections"] = "[{}]",
            ["publicNetworkAccess"] = "Disabled",
        };

        Assert.True(AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(properties));
    }
}
