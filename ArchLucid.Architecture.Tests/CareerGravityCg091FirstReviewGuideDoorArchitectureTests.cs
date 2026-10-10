using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-091 ratchet: first-review guide does not launder Simulator runs as Career on Working.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg091FirstReviewGuideDoorArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg091_first_review_guide_wires_career_honesty_state()
    {
        string honesty = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "first-review-guide-career-honesty.ts"));
        string hook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-first-review-guide-state.ts"));
        string status = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "first-review-guide-status.ts"));

        honesty.Should().Contain("shouldSuppressReadyToFinalizeForCareerHonesty");
        hook.Should().Contain("resolveFirstReviewGuideCareerHonestyContext");
        status.Should().Contain("suppressReadyToFinalize");
    }

    [Fact]
    public void Cg091_docs_record_first_review_guide_rehearsal_honesty()
    {
        string docs = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-091");
        docs.Should().Contain("First-review guide does not launder Career");
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
