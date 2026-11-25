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

    [Theory]
    [InlineData("[]", "None")]
    [InlineData("[{}]", "Unknown")]
    [InlineData("{", "Unknown")]
    [InlineData("[{\"id\":\"connection1\",\"properties\":{\"privateLinkServiceConnectionState\":{\"status\":\"Pending\"}}}]", "NotApproved")]
    [InlineData("[{\"id\":\"connection1\",\"properties\":{\"privateLinkServiceConnectionState\":{\"status\":\"Rejected\"}}}]", "NotApproved")]
    [InlineData("[{\"id\":\"connection1\",\"properties\":{\"privateLinkServiceConnectionState\":{\"status\":\"Approved\"}}}]", "Approved")]
    public void PrivateEndpointApproval_requires_explicit_status(string connections, string expected)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicNetworkAccess"] = "Disabled",
            ["privateEndpointConnections"] = connections,
        };
        Assert.Equal(expected, AzureInventoryPublicNetworkAccessResolver.ResolvePrivateEndpointApproval(properties).ToString());
        Assert.Equal(expected == "Approved", AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(properties));
    }

    [Fact]
    public void Conflicting_public_access_aliases_remain_unknown()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicNetworkAccess"] = "Disabled",
            ["enablePublicNetworkAccess"] = "true",
        };
        Assert.Equal(AzureInventoryPublicNetworkAccessResolver.ObservedPublicAccess.Unknown,
            AzureInventoryPublicNetworkAccessResolver.ResolvePublicAccess(properties));
        Assert.False(AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(properties));
    }

    [Fact]
    public void IsPrivateEndpointOnlyExposure_requires_pe_without_public_access()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["privateEndpointConnections"] = """[{"id":"connection1","properties":{"privateLinkServiceConnectionState":{"status":"Approved"}}}]""",
            ["publicNetworkAccess"] = "Disabled",
        };

        Assert.True(AzureInventoryPublicNetworkAccessResolver.IsPrivateEndpointOnlyExposure(properties));
    }
}
