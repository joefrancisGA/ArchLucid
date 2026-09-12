using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-096 ratchet: error/recovery surfaces on Working do not promise Career after Retry.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg096ErrorPagesDoorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg096_review_detail_error_wires_recovery_career_honesty()
    {
        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "error-recovery",
                "error-recovery-career-honesty.ts"));
        string reviewError = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "error.tsx"));

        copy.Should().Contain("ERROR_RECOVERY_RETRY_NO_POSTURE_CHANGE");
        copy.Should().Contain("does not mark a rehearsal run Career-complete");
        reviewError.Should().Contain("ErrorRecoveryCareerHonestyStrip");
        reviewError.Should().Contain("scopedRunId={reviewId}");
    }

    [Fact]
    public void Cg096_docs_record_error_recovery_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-096");
        docs.Should().Contain("Error recovery does not promise Career");
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
