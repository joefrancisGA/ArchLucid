using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceReportMarkdownTests
{
    [Fact]
    public void Compose_contains_disclaimer_and_environment_label()
    {
        DeploymentEvidenceProbeResult live =
            new("GET /health/live", 200, true, "HTTP 200", [], "(empty body)");

        DeploymentEvidenceProbeBundle bundle = new([live], allRequiredPassed: true);

        string md = DeploymentEvidenceReportMarkdown.Compose(
            environmentName: "staging",
            apiBaseUrl: "https://staging.example.com",
            apiBaseUrlRedacted: "https://staging.example.com",
            generatedAtUtc: new DateTime(2026, 5, 6, 12, 0, 0, DateTimeKind.Utc),
            repositoryRoot: "C:\\repo",
            gitHeadSha: "deadbeef",
            gitDirty: false,
            bundle,
            cli: null,
            allowMissingOpenApi: false,
            syntheticPath: "/version");

        md.Should().Contain("host-environment deployment evidence");
        md.Should().Contain("not** a global product certification");
        md.Should().Contain("| **Environment label** | staging |");
        md.Should().Contain("deadbeef");
    }

    [Fact]
    public void AppendPostureSection_lists_archlucid_json_row_when_config_present()
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig cli = new()
        {
            SchemaVersion = "1.0",
            ProjectName = "pilot",
            ApiUrl = "http://127.0.0.1:5128",
            Inputs = new ArchLucidProjectScaffolder.InputsSection { Brief = "brief.md" },
            Outputs = new ArchLucidProjectScaffolder.OutputsSection { LocalCacheDir = "out" }
        };

        StringBuilder sb = new();

        DeploymentEvidenceReportMarkdown.AppendPostureSection(sb, cli, "http://127.0.0.1:5128");

        sb.ToString().Should().Contain("archlucid.json:** loaded");
        sb.ToString().Should().Contain("pilot");
        sb.ToString().Should().Contain("127.0.0.1:5128");
    }
}
