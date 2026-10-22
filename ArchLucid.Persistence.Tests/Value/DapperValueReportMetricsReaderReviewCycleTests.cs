namespace ArchLucid.Persistence.Tests.Value;

/// <summary>
///     Guard-rail: review-cycle SQL stays aligned with golden-manifest window scoping (no LocalDB harness in this
///     assembly).
/// </summary>
[Trait("Category", "Unit")]
public sealed class DapperValueReportMetricsReaderReviewCycleTests
{
    [SkippableFact]
    public void DapperValueReportMetricsReader_source_contains_join_and_avg_hours_expression()
    {
        string source = ReadAllPartialSources();

        source.Should().Contain("INNER JOIN dbo.Runs r ON m.RunId = r.RunId");
        source.Should().Contain("DATEDIFF(SECOND, r.CreatedUtc, m.CreatedUtc)");
        source.Should().Contain("BaselineReviewCycleHours");
    }

    [SkippableFact]
    public void DapperValueReportMetricsReader_governance_sql_uses_single_nolock_hint()
    {
        string source = ReadAllPartialSources();

        source.Should().NotContain("WITH (NOLOCK) WITH (NOLOCK)");
        source.Should().Contain("FROM dbo.AuditEvents WITH (NOLOCK)");
    }

    private static string ReadAllPartialSources()
    {
        string root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string directory = Path.Combine(root, "ArchLucid.Persistence", "Value");

        return string.Concat(
            Directory
                .GetFiles(directory, "DapperValueReportMetricsReader*.cs")
                .OrderBy(path => path, StringComparer.Ordinal)
                .Select(File.ReadAllText));
    }
}
