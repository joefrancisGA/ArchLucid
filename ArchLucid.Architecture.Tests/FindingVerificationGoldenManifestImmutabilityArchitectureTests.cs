using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-2033 / ADR 0062 slice 1: verification persistence must never mutate sealed golden manifest rows.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingVerificationGoldenManifestImmutabilityArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] GuardedRelativePaths =
    [
        Path.Combine("ArchLucid.Persistence", "Findings", "SqlFindingVerificationReportRepository.cs"),
        Path.Combine("ArchLucid.Persistence", "Findings", "InMemoryFindingVerificationReportRepository.cs"),
        Path.Combine("ArchLucid.Application", "Findings", "FindingVerification", "FindingVerificationService.cs"),
        Path.Combine("ArchLucid.Persistence", "Migrations", "373_FindingVerificationReports.sql"),
    ];

    [Fact]
    public void Finding_verification_slice1_sources_do_not_write_golden_manifest_rows()
    {
        foreach (string relativePath in GuardedRelativePaths)
        {
            string absolutePath = Path.Combine(RepoRoot, relativePath);
            File.Exists(absolutePath).Should().BeTrue($"expected guarded source at {relativePath}");

            string text = File.ReadAllText(absolutePath);

            text.Should().NotContain(
                "UPDATE dbo.GoldenManifests",
                because: $"{relativePath} must remain append-only relative to sealed packages");

            text.Should().NotContain(
                "INSERT INTO dbo.GoldenManifests",
                because: $"{relativePath} must not create golden manifest rows");

            text.Should().NotContain(
                "DELETE FROM dbo.GoldenManifests",
                because: $"{relativePath} must not delete golden manifest rows");
        }
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root containing ArchLucid.sln.");
    }
}
