using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceOptionsTests
{
    [Fact]
    public void Parse_requires_environment_and_url()
    {
        DeploymentEvidenceOptions? o = DeploymentEvidenceOptions.Parse(
            ["--environment", "staging", "--api-base-url", "https://api.example.com"],
            out string? error);

        error.Should().BeNull();
        o.Should().NotBeNull();
        o.EnvironmentName.Should().Be("staging");
        o.ApiBaseUrl.Should().Be("https://api.example.com");
        o.SyntheticPath.Should().Be("/version");
        o.AllowMissingOpenApi.Should().BeFalse();
    }

    [Fact]
    public void Parse_normalizes_synthetic_path_without_leading_slash()
    {
        DeploymentEvidenceOptions? o = DeploymentEvidenceOptions.Parse(
            [
                "--environment", "production",
                "--api-base-url", "https://api.example.com",
                "--synthetic-path", "health/live"
            ],
            out string? error);

        error.Should().BeNull();
        o!.SyntheticPath.Should().Be("/health/live");
    }

    [Fact]
    public void Parse_missing_environment_yields_error()
    {
        DeploymentEvidenceOptions? o = DeploymentEvidenceOptions.Parse(
            ["--api-base-url", "https://api.example.com"],
            out string? error);

        o.Should().BeNull();
        error.Should().Contain("--environment");
    }

    [Fact]
    public void SanitizeEnvironmentToken_replaces_unsafe_chars()
    {
        DeploymentEvidenceOptions.SanitizeEnvironmentToken("Staging (EU)")
            .Should()
            .Be("staging-eu");
    }

    [Fact]
    public void ResolveDefaultOutPath_uses_run_id_when_set()
    {
        string? prior = Environment.GetEnvironmentVariable("GITHUB_RUN_ID");

        try
        {
            Environment.SetEnvironmentVariable("GITHUB_RUN_ID", "12345");

            DeploymentEvidenceOptions o = new(
                "production",
                "https://x.example",
                null,
                null,
                "/version",
                allowMissingOpenApi: false);

            o.ResolveDefaultOutPath().Should().Be(Path.Combine("artifacts", "deployment-evidence-production-12345.md"));
        }
        finally
        {
            Environment.SetEnvironmentVariable("GITHUB_RUN_ID", prior);
        }
    }
}
