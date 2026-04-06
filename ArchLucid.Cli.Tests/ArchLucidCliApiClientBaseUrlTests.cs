using FluentAssertions;

namespace ArchLucid.Cli.Tests;

public sealed class ArchLucidApiClientBaseUrlTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void GetInvalidApiBaseUrlReason_when_empty_returns_message(string? url)
    {
        string? reason = ArchLucidApiClient.GetInvalidApiBaseUrlReason(url);

        reason.Should().NotBeNull();
        reason.ToLowerInvariant().Should().Contain("empty");
    }

    [Fact]
    public void GetInvalidApiBaseUrlReason_when_relative_returns_message()
    {
        string? reason = ArchLucidApiClient.GetInvalidApiBaseUrlReason("/api/v1");

        reason.Should().NotBeNull();
    }

    [Fact]
    public void GetInvalidApiBaseUrlReason_when_non_http_scheme_returns_message()
    {
        string? reason = ArchLucidApiClient.GetInvalidApiBaseUrlReason("ftp://host");

        reason.Should().NotBeNull();
        reason.ToLowerInvariant().Should().Contain("http");
    }

    [Theory]
    [InlineData("http://localhost:5128")]
    [InlineData("https://api.example.com")]
    [InlineData("http://127.0.0.1:5128/v1")]
    public void GetInvalidApiBaseUrlReason_when_valid_returns_null(string url)
    {
        ArchLucidApiClient.GetInvalidApiBaseUrlReason(url).Should().BeNull();
    }

    [Fact]
    public void Constructor_throws_ArgumentException_with_clear_message_when_url_invalid()
    {
        Action act = () => _ = new ArchLucidApiClient(":::not-a-url");

        act.Should().Throw<ArgumentException>().WithParameterName("baseUrl");
    }
}
