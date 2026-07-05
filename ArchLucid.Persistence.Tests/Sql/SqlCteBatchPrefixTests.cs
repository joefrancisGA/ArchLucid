namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards CTE batches that may follow another statement in the same ADO.NET command text.
/// </summary>
[Trait("Category", "Unit")]
public sealed class SqlCteBatchPrefixTests
{
    [SkippableFact]
    public void ProductLearning_pilot_signal_sql_ctes_use_semicolon_prefix()
    {
        string root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string path = Path.Combine(
            root,
            "ArchLucid.Persistence",
            "Coordination",
            "ProductLearning",
            "DapperProductLearningPilotSignalRepository.cs");
        string source = File.ReadAllText(path);

        source.Should().Contain(";WITH Scoped AS (");
        source.Should().NotContain("\n                           WITH Scoped AS (");
    }

    [SkippableFact]
    public void DataConsistency_orphan_remediation_sql_ctes_use_semicolon_prefix()
    {
        string root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        string path = Path.Combine(
            root,
            "ArchLucid.Host.Core",
            "DataConsistency",
            "DataConsistencyOrphanRemediationSql.cs");
        string source = File.ReadAllText(path);

        source.Should().Contain(";WITH cte AS (");
        source.Should().NotContain("\n                                                                  WITH cte AS (");
    }
}
