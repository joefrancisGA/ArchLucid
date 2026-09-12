using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-038 ratchet: draft-to-draft Compare is out of wave — record residual only, no API.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn038DoNotImplementDraftCompareArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn038_records_draft_compare_as_not_shipped_residual()
    {
        string residuals = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-out-of-wave-residuals.ts"));
        string doc = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md"));
        string prompts = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_COMPOSER_PROMPTS.md"));

        residuals.Should().Contain("SN-038");
        residuals.Should().Contain("not-shipped");
        residuals.Should().Contain("Draft-to-draft Compare");
        residuals.Should().Contain("SN-014");

        doc.Should().Contain("SN-038");
        doc.Should().Contain("Not shipped");
        doc.Should().Contain("Do not claim");

        prompts.Should().Contain("SYSTEM_NOT_JOB_OUT_OF_WAVE_RESIDUALS.md");
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
