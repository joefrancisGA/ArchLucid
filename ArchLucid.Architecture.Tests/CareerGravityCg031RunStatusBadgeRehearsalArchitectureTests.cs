using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-031 ratchet: RunStatusBadge applies Working career honesty overlay on finalized runs.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg031RunStatusBadgeRehearsalArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg031_badge_wires_stamp_door_and_career_honesty_overlay()
    {
        string badge = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "runs", "RunStatusBadge.tsx"));
        string presentation = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-pipeline-status-presentation.ts"));
        string honesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-status-badge-career-honesty.ts"));

        badge.Should().Contain("useEffectiveWorkingCareerRehearsalDoor");
        badge.Should().Contain("resolveHonestyWorkingCareerRehearsalDoor");
        presentation.Should().Contain("applyRunStatusBadgeWorkingCareerHonesty");
        honesty.Should().Contain("RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL");
        honesty.Should().Contain("RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL");
        honesty.Should().Contain("career-simulator-blocked");
    }

    [Fact]
    public void Cg031_docs_record_run_status_badge_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-031");
        docs.Should().Contain("RunStatusBadge");
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
