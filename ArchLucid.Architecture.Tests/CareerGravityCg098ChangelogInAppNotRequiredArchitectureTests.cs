using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-098 ratchet: in-app changelog is out of wave — record residual only, no UI.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg098ChangelogInAppNotRequiredArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg098_records_changelog_as_not_shipped_residual()
    {
        string residuals = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "career-gravity-out-of-wave-residuals.ts"));
        string doc = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md"));
        string prompts = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "CAREER_GRAVITY_COMPOSER_PROMPTS.md"));

        residuals.Should().Contain("CG-098");
        residuals.Should().Contain("not-shipped");
        residuals.Should().Contain("In-app changelog");

        doc.Should().Contain("CG-098");
        doc.Should().Contain("Not shipped");
        doc.Should().Contain("Do not claim");

        prompts.Should().Contain("CAREER_GRAVITY_OUT_OF_WAVE_RESIDUALS.md");
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
