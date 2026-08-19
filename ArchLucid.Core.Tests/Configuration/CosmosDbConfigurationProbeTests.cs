using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Cosmos;

using Microsoft.Extensions.Configuration;

using Xunit;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class CosmosDbConfigurationProbeTests
{
    [Fact]
    public void IsPolyglotCredentialConfigured_accepts_managed_identity_with_account_endpoint()
    {
        CosmosDbOptions options = new()
        {
            GraphSnapshotsEnabled = true,
            AuthenticationMode = CosmosDbConfigurationProbe.ManagedIdentityAuthenticationMode,
            AccountEndpoint = "https://contoso.documents.azure.com:443/",
        };

        Assert.True(CosmosDbConfigurationProbe.IsPolyglotCredentialConfigured(options));
        Assert.True(CosmosDbConfigurationProbe.UsesManagedIdentity(options));
    }

    [Fact]
    public void IsPolyglotCredentialConfigured_requires_connection_string_in_default_mode()
    {
        CosmosDbOptions options = new()
        {
            AgentTracesEnabled = true,
        };

        Assert.False(CosmosDbConfigurationProbe.IsPolyglotCredentialConfigured(options));
    }

    [Fact]
    public void UsesManagedIdentity_reads_configuration_section()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["CosmosDb:AuthenticationMode"] = "ManagedIdentity",
                })
            .Build();

        Assert.True(CosmosDbConfigurationProbe.UsesManagedIdentity(configuration));
    }
}
