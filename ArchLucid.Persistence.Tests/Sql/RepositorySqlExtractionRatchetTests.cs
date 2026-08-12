using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Ratchet for the ongoing migration of Dapper SQL out of repository method bodies into named companion classes.
/// </summary>
/// <remarks>
///     Most repositories still hold inline SQL, so this cannot assert the rule repository-wide. Instead it pins the
///     ones already migrated: each must contain no SQL statement text and must still source its statements from the
///     named companion. Add a row here when you extract another repository; that is what makes the migration
///     one-directional.
/// </remarks>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RepositorySqlExtractionRatchetTests
{
    /// <summary>Statement openers that should never appear in a fully extracted repository.</summary>
    private static readonly string[] SqlStatementMarkers =
    [
        "SELECT ",
        "INSERT INTO",
        "UPDATE ",
        "DELETE FROM",
        "MERGE "
    ];

    /// <summary>
    ///     Repository source path (relative to the repo root), the companion class it must use, and that companion's own
    ///     path. Companions usually sit beside their repository, but shared statement classes live under
    ///     <c>ArchLucid.Persistence/Sql/</c>, so the path is spelled out rather than derived.
    /// </summary>
    public static TheoryData<string, string, string> ExtractedRepositories =>
        new()
        {
            {
                "ArchLucid.Persistence/IntegrationOutbox/DapperIntegrationEventOutboxRepository.cs",
                "IntegrationEventOutboxSql",
                "ArchLucid.Persistence/IntegrationOutbox/IntegrationEventOutboxSql.cs"
            },
            {
                "ArchLucid.Persistence/Coordination/ProductLearning/DapperProductLearningPilotSignalRepository.cs",
                "ProductLearningPilotSignalSql",
                "ArchLucid.Persistence/Coordination/ProductLearning/ProductLearningPilotSignalSql.cs"
            },
            {
                "ArchLucid.Persistence/Coordination/ProductLearning/Planning/DapperProductLearningPlanningPlanLinkRepository.cs",
                "ProductLearningPlanningPlanLinkSql",
                "ArchLucid.Persistence/Coordination/ProductLearning/Planning/ProductLearningPlanningPlanLinkSql.cs"
            },
            {
                "ArchLucid.Persistence/Tenancy/DapperTenantRepository.Directory.cs",
                "TenantDirectorySql",
                "ArchLucid.Persistence/Tenancy/TenantDirectorySql.cs"
            },
            {
                "ArchLucid.Persistence/Repositories/SqlFindingsSnapshotRepository.cs",
                "FindingsSnapshotWriteSql",
                "ArchLucid.Persistence/Sql/FindingsSnapshotWriteSql.cs"
            }
        };

    [Theory]
    [MemberData(nameof(ExtractedRepositories))]
    public void Extracted_repositories_hold_no_inline_sql(
        string relativePath,
        string companionClass,
        string companionPath)
    {
        string source = ReadRepoFile(relativePath);

        IReadOnlyList<string> found = [.. SqlStatementMarkers.Where(marker => source.Contains(marker, StringComparison.Ordinal))];

        found.Should().BeEmpty(
            $"SQL for '{relativePath}' belongs in {companionClass} ({companionPath}), not in a method body");
    }

    [Theory]
    [MemberData(nameof(ExtractedRepositories))]
    public void Extracted_repositories_still_source_statements_from_their_companion(
        string relativePath,
        string companionClass,
        string companionPath)
    {
        string source = ReadRepoFile(relativePath);

        source.Should().Contain(
            companionClass + ".",
            because:
            $"an extracted repository that stops referencing {companionPath} has lost its SQL, not cleaned it up");
    }

    /// <summary>
    ///     Guards the companion classes themselves, so extraction cannot be undone by inlining the constants back into
    ///     interpolated strings that analyzers and reviewers cannot read statically.
    /// </summary>
    [Theory]
    [MemberData(nameof(ExtractedRepositories))]
    public void Companion_classes_expose_statements_as_constants(
        string relativePath,
        string companionClass,
        string companionPath)
    {
        string source = ReadRepoFile(companionPath);

        source.Should().Contain("internal static class " + companionClass);

        Regex.IsMatch(source, @"public const string \w+ =")
            .Should()
            .BeTrue(
                $"{companionClass} must expose the statements used by '{relativePath}' as compile-time constants");
    }

    private static string ReadRepoFile(string relativePath, [CallerFilePath] string? callerFilePath = null)
    {
        string testsSqlDir = Path.GetDirectoryName(callerFilePath)
                             ?? throw new InvalidOperationException("Caller path unavailable.");

        // <repo>/ArchLucid.Persistence.Tests/Sql/<this file> — two levels up is the repo root.
        string repoRoot = Path.GetFullPath(Path.Combine(testsSqlDir, "..", ".."));
        string fullPath = Path.Combine(repoRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));

        File.Exists(fullPath).Should().BeTrue($"'{relativePath}' must exist; update the ratchet when files move");

        return File.ReadAllText(fullPath);
    }
}
