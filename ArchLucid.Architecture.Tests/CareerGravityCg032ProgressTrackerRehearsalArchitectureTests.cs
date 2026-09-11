using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-032 ratchet: progress tracker applies Working rehearsal honesty copy on terminal analysis.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg032ProgressTrackerRehearsalArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg032_progress_tracker_wires_career_honesty_terminal_and_step_labels()
    {
        string hook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "use-run-progress-tracker.ts"));
        string stages = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunProgressTrackerStagesView.tsx"));
        string honesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-progress-tracker-career-honesty.ts"));

        hook.Should().Contain("resolveRunProgressTrackerCareerHonesty");
        hook.Should().Contain("careerHonestyPresentation");
        stages.Should().Contain("careerHonestyPresentation");
        honesty.Should().Contain("RUN_PROGRESS_TRACKER_CAREER_BLOCKED_TERMINAL_STATUS");
        honesty.Should().Contain("RUN_PROGRESS_TRACKER_REHEARSAL_SIGNED_RECORD_LABEL");
    }

    [Fact]
    public void Cg032_docs_record_progress_tracker_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-032");
        docs.Should().Contain("progress tracker");
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
