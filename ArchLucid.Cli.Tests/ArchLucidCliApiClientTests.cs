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
        string? priorLucid = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");
        string? priorLegacy = Environment.GetEnvironmentVariable("ARCHIFORGE_API_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", null);
            Environment.SetEnvironmentVariable("ARCHIFORGE_API_URL", null);
            string result = ArchLucidApiClient.ResolveBaseUrl(null);
            result.Should().Be("http://localhost:5128");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", priorLucid);
            Environment.SetEnvironmentVariable("ARCHIFORGE_API_URL", priorLegacy);
        }
    }

    [Fact]
    public void ResolveBaseUrl_WhenConfigNull_prefers_ARCHLUCID_API_URL_over_legacy()
    {
        string? priorLucid = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");
        string? priorLegacy = Environment.GetEnvironmentVariable("ARCHIFORGE_API_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", "http://preferred:7070");
            Environment.SetEnvironmentVariable("ARCHIFORGE_API_URL", "http://legacy:6060");

            string result = ArchLucidApiClient.ResolveBaseUrl(null);

            result.Should().Be("http://preferred:7070");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", priorLucid);
            Environment.SetEnvironmentVariable("ARCHIFORGE_API_URL", priorLegacy);
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
