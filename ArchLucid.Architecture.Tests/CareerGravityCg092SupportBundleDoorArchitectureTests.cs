using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-092 ratchet: support-bundle triage index includes CG-019 door/mode stamp for on-call triage.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg092SupportBundleDoorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg092_triage_index_builder_resolves_career_posture_from_run_stamp()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "Support", "SupportBundleTriageIndexBuilder.cs"));

        builder.Should().Contain("ExportBundleCareerPostureResolver.ResolveTriageFromRunFields");
        builder.Should().Contain("CareerPosture");
        builder.Should().Contain("ExecutePostureCapturedUtc");
    }

    [Fact]
    public void Cg092_cli_run_info_includes_execute_door_stamp_fields()
    {
        string runInfo = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "ArchLucidCliApiClient.Results.Runs.cs"));

        runInfo.Should().Contain("WorkingCareerRehearsalDoor");
        runInfo.Should().Contain("ExecutePostureCapturedUtc");
    }

    [Fact]
    public void Cg092_docs_record_support_bundle_door_stamp()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));
        string runbook = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "runbooks", "FIRST_PILOT_SUPPORT_TRIAGE.md"));

        docs.Should().Contain("CG-092");
        docs.Should().Contain("triage-index");
        runbook.Should().Contain("careerPosture");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
