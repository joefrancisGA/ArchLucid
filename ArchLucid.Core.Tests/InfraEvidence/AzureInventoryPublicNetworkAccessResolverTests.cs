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
