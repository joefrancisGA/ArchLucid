using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class JourneyOptionsParserTests
{
    [Fact]
    public void Parse_requires_api_base_url()
    {
        string? prior = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", null);

            JourneyOptions? options = JourneyOptionsParser.Parse([], out string? error);

            options.Should().BeNull();
            error.Should().Contain("ARCHLUCID_API_URL");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", prior);
        }
    }

    [Fact]
    public void Parse_accepts_explicit_api_base_url_and_timeouts()
    {
        JourneyOptions? options = JourneyOptionsParser.Parse(
            [
                "--api-base-url", "http://127.0.0.1:5128/",
                "--timeout-seconds", "120",
                "--poll-interval-seconds", "2",
                "--from-file", "req.json",
                "--json-out", "out.json"
            ],
            out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.ApiBaseUrl.Should().Be("http://127.0.0.1:5128");
        options.TimeoutSeconds.Should().Be(120);
        options.PollIntervalSeconds.Should().Be(2);
        options.ArchitectureRequestJsonPath.Should().Be("req.json");
        options.JsonOutPath.Should().Be("out.json");
    }

    [Fact]
    public void Parse_rejects_unknown_flag()
    {
        JourneyOptions? options = JourneyOptionsParser.Parse(
            ["--api-base-url", "http://localhost", "--nope"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("Unknown flag");
    }
}
