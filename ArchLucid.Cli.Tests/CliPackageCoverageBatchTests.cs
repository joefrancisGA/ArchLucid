using ArchLucid.Cli.Stack;
using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatchTests
{
    [Fact]
    public void ArchlucidStackPaths_exposes_documented_relative_paths()
    {
        ArchlucidStackPaths.SchemaRelativePath.Should().Be("deploy/archlucid.stack.schema.json");
        ArchlucidStackPaths.ExampleRelativePath.Should().Be("deploy/archlucid.stack.example.yaml");
        ArchlucidStackPaths.DefaultAnswersFileName.Should().Be("archlucid.stack.yaml");
        ArchlucidStackPaths.GeneratedRootRelativePath.Should().Be("deploy/generated");
    }

    [Fact]
    public void ArchlucidStackKeyVaultSecretNames_lists_hosted_pilot_secret_names()
    {
        IReadOnlyList<string> secrets = ArchlucidStackKeyVaultSecretNames.HostedPilotSecrets;

        secrets.Should().Contain("archlucid-sql-connection-string");
        secrets.Should().Contain("archlucid-webhook-hmac-secret");
        secrets.Count.Should().BeGreaterThan(5);
    }

    [Fact]
    public void StackInitOptions_TryParse_accepts_known_flags()
    {
        bool parsed = StackInitOptions.TryParse(
            ["--from-example", "--force", "--answers", "stack.yaml", "--out", "out", "--repo-root", "C:\\repo"],
            out StackInitOptions? options,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.FromExample.Should().BeTrue();
        options.Force.Should().BeTrue();
        options.AnswersPath.Should().Be("stack.yaml");
        options.OutputDirectory.Should().Be("out");
        options.RepositoryRoot.Should().Be("C:\\repo");
    }

    [Fact]
    public void StackInitOptions_TryParse_rejects_unknown_argument()
    {
        bool parsed = StackInitOptions.TryParse(["--unknown"], out StackInitOptions? options, out string? error);

        parsed.Should().BeFalse();
        options.Should().BeNull();
        error.Should().Contain("Unknown argument");
    }

    [Fact]
    public void StackDoctorReportFormatter_renders_markdown_and_json()
    {
        StackDoctorReport report = new()
        {
            Profile = "pilot",
            RepositoryRoot = "C:\\repo",
            GeneratedUtc = new DateTime(2026, 7, 12, 12, 0, 0, DateTimeKind.Utc),
            OverallVerdict = StackDoctorVerdict.Pass,
            Steps =
            [
                new StackDoctorStepResult
                {
                    StepId = "config-lint",
                    DisplayName = "Validate configuration",
                    Verdict = StackDoctorVerdict.Pass,
                    Detail = "ok",
                },
            ],
        };

        string markdown = StackDoctorReportFormatter.ToMarkdown(report);
        string json = StackDoctorReportFormatter.ToJson(report);

        markdown.Should().Contain("Stack doctor report");
        markdown.Should().Contain("Validate configuration");
        json.Should().Contain("\"profile\": \"pilot\"");
    }

    [Fact]
    public void StackDiffOptions_TryParse_accepts_answers_and_output_paths()
    {
        bool parsed = StackDiffOptions.TryParse(
            ["--answers", "stack.yaml", "--out", "out", "--repo-root", "C:\\repo"],
            out StackDiffOptions? options,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        options!.AnswersPath.Should().Be("stack.yaml");
        options.OutputDirectory.Should().Be("out");
        options.RepositoryRoot.Should().Be("C:\\repo");
    }

    [Fact]
    public void ArchlucidStackAzureSection_exposes_subscription_and_location()
    {
        ArchlucidStackAzureSection section = new()
        {
            SubscriptionId = "sub-1",
            Location = "eastus",
        };

        section.SubscriptionId.Should().Be("sub-1");
        section.Location.Should().Be("eastus");
    }

    [Fact]
    public void ArchlucidStackDeploymentSection_exposes_pilot_budget_flags()
    {
        ArchlucidStackDeploymentSection section = new()
        {
            MultiRootApplyOptIn = true,
            PilotMonthlyBudgetUsd = 250,
        };

        section.MultiRootApplyOptIn.Should().BeTrue();
        section.PilotMonthlyBudgetUsd.Should().Be(250);
    }
}
