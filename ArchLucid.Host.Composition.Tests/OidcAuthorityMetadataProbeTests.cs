using ArchLucid.Host.Core.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
public sealed class OidcAuthorityMetadataProbeTests
{
    [Fact]
    public async Task ProbeAsync_skips_when_auth_mode_is_not_jwt_bearer()
    {
        Dictionary<string, string?> settings = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "ApiKey",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        HttpClient client = new(new HttpClientHandler());

        OidcAuthorityMetadataProbe.ProbeResult result =
            await OidcAuthorityMetadataProbe.ProbeAsync(configuration, client, CancellationToken.None);

        result.IsApplicable.Should().BeFalse();
    }
}
