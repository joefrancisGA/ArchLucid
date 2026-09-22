using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-079 ratchet: Rehearsal Working cannot show Ready-to-finalize pipeline label.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs079RehearsalCannotScreenshotReadyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As079_finalize_honesty_suppresses_ready_for_rehearsal_intent()
    {
        string honesty = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-pipeline-finalize-blocked-honesty.ts"));

        honesty.Should().Contain("shouldLabelWorkingIntentAsRehearsal");
        honesty.Should().Contain("workingCareerRehearsalIntent");

        string vitest = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-pipeline-finalize-blocked-honesty.test.ts"));

        vitest.Should().Contain("AS-079");
        vitest.Should().Contain("workingCareerRehearsalIntent: \"rehearsal\"");
    }

    [Fact]
    public void As079_run_status_badge_wires_working_rehearsal_intent()
    {
        string badge = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunStatusBadge.tsx"));

        badge.Should().Contain("useWorkingCareerRehearsalIntent");
        badge.Should().Contain("workingCareerRehearsalIntent");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
