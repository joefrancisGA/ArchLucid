using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>
/// Tests for Archi Forge Api Client.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArchLucidApiClientTests
{
    [Fact]
    public void ResolveBaseUrl_WhenConfigHasApiUrl_ReturnsConfigUrl()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            ApiUrl = "https://custom:9090"
        };

        string result = ArchLucidApiClient.ResolveBaseUrl(config);

        result.Should().Be("https://custom:9090");
    }

    [Fact]
    public void ResolveBaseUrl_WhenConfigNull_ReturnsDefaultOrEnv()
    {
        string envKey = "ARCHIFORGE_API_URL";
        string? previous = Environment.GetEnvironmentVariable(envKey);
        try
        {
            Environment.SetEnvironmentVariable(envKey, null);
            string result = ArchLucidApiClient.ResolveBaseUrl(null);
            result.Should().Be("http://localhost:5128");
        }
        finally
        {
            Environment.SetEnvironmentVariable(envKey, previous);
        }
    }

    [Fact]
    public void ResolveBaseUrl_WhenConfigHasApiUrlWithTrailingSlash_TrimsSlash()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            ApiUrl = "http://localhost:5128/"
        };

        string result = ArchLucidApiClient.ResolveBaseUrl(config);

        result.Should().Be("http://localhost:5128");
    }
}
