using System.IO;
using System.Runtime.CompilerServices;

namespace ArchLucid.Persistence.Tests.ProductLearning;

/// <summary>
///     Guards the Dapper artifact-trends SQL against the SQL Server 8120 regression that surfaced as a false
///     DATABASE_UNAVAILABLE on Review feedback (<c>/v1/product-learning/*</c>).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DapperProductLearningArtifactTrendsSqlGuardTests
{
    [Fact]
    public void ListArtifactOutcomeTrendsSql_DoesNotSelectNonGroupedArtifactHintFallback()
    {
        string source = ReadPilotSignalSqlSource();

        // Bad form: SELECT COALESCE(..., SubjectType) while GROUP BY uses COALESCE(..., N'*') —
        // SQL Server rejects ArtifactHint as not aggregated / not grouped (error 8120).
        const string forbiddenSelect =
            "COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), SubjectType) AS ArtifactTypeOrHint";

        source.Should().NotContain(forbiddenSelect);

        source.Should().Contain(
            "WHEN COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'*') = N'*'",
            because: "empty artifact hint must fall back via a GROUP BY-safe CASE");
    }

    /// <summary>
    ///     Reads the SQL companion rather than the repository, because the statements were extracted out of the
    ///     repository's method bodies (see <c>RepositorySqlExtractionRatchetTests</c>).
    /// </summary>
    private static string ReadPilotSignalSqlSource([CallerFilePath] string? callerFilePath = null)
    {
        string testsDir = Path.GetDirectoryName(callerFilePath)
                          ?? throw new InvalidOperationException("Caller path unavailable.");
        string repoRoot = Path.GetFullPath(Path.Combine(testsDir, "..", ".."));
        string sqlPath = Path.Combine(
            repoRoot,
            "ArchLucid.Persistence",
            "Coordination",
            "ProductLearning",
            "ProductLearningPilotSignalSql.cs");

        File.Exists(sqlPath).Should().BeTrue("SQL companion source must be adjacent to the test project");

        return File.ReadAllText(sqlPath);
    }
}
