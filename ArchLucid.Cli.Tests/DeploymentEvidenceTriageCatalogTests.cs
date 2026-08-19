using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceTriageCatalogTests
{
    [Fact]
    public void LiveFailure_includes_redacted_base_url()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.LiveFailure("https://api.example.com");

        lines.Should().Contain(line => line.Contains("https://api.example.com/health/live", StringComparison.Ordinal));
        lines.Should().Contain(line => line.Contains("DEPLOYMENT_RUNBOOK", StringComparison.Ordinal));
    }

    [Fact]
    public void ReadyFailure_lists_dependency_recovery_steps()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.ReadyFailure();

        lines.Should().HaveCount(3);
        lines[0].Should().Contain("/health/ready");
    }

    [Fact]
    public void OpenApiFailure_mentions_allow_missing_openapi_override()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.OpenApiFailure("https://api.example.com");

        lines.Should().Contain(line => line.Contains("--allow-missing-openapi", StringComparison.Ordinal));
    }

    [Fact]
    public void VersionFailure_mentions_front_door_and_revision_checks()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.VersionFailure();

        lines.Should().Contain(line => line.Contains("/version", StringComparison.Ordinal));
        lines.Should().Contain(line => line.Contains("containerapp revision", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void SyntheticFailure_includes_path_and_smoke_env_var()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.SyntheticFailure("/health/live");

        lines.Should().Contain(line => line.Contains("/health/live", StringComparison.Ordinal));
        lines.Should().Contain(line => line.Contains("SMOKE_SYNTHETIC_PATH", StringComparison.Ordinal));
    }

    [Fact]
    public void TransportFailure_includes_verb_label_and_retry_variables()
    {
        IReadOnlyList<string> lines = DeploymentEvidenceTriageCatalog.TransportFailure("GET /version");

        lines[0].Should().Contain("GET /version");
        lines.Should().Contain(line => line.Contains("CD_POST_DEPLOY_MAX_ATTEMPTS", StringComparison.Ordinal));
    }
}
