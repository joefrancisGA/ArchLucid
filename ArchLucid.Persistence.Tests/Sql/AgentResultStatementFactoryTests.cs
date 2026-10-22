using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultStatementFactoryTests
{
    public static TheoryData<string> RunScopedStatements =>
        new()
        {
            AgentResultStatementFactory.BuildSelectResultJsonByRunId(),
            AgentResultStatementFactory.BuildSelectAgentTypeMarkersByRunId(),
            AgentResultStatementFactory.BuildSelectRollupProjectionByRunId(),
        };

    public static TheoryData<string> EvidenceProposalStatements =>
        new()
        {
            AgentResultStatementFactory.BuildListEvidenceProposals(),
            AgentResultStatementFactory.BuildSelectEvidenceProposalByResultId(),
        };

    /// <summary>
    ///     <c>AgentResults</c> has no denormalized scope triple, so every read must reach tenant scope through
    ///     <c>dbo.Runs</c>.
    /// </summary>
    [Theory]
    [MemberData(nameof(RunScopedStatements))]
    public void Run_scoped_reads_join_runs_and_filter_on_the_scope_triple(string sql)
    {
        sql.Should().Contain("INNER JOIN dbo.Runs");
        sql.Should().Contain("@TenantId");
        sql.Should().Contain("@WorkspaceId");
        sql.Should().Contain("@ScopeProjectId");
        sql.Should().Contain("WHERE ar.RunId = @RunId");
    }

    [Theory]
    [MemberData(nameof(RunScopedStatements))]
    public void Run_scoped_reads_are_ordered_and_row_capped(string sql)
    {
        sql.Should().Contain("ORDER BY ar.CreatedUtc");
        sql.Should().Contain("OFFSET 0 ROWS FETCH NEXT 1000 ROWS ONLY");
        sql.Should().EndWith(";");
    }

    [Theory]
    [MemberData(nameof(EvidenceProposalStatements))]
    public void Evidence_proposal_reads_join_enrichments_and_stay_scoped(string sql)
    {
        sql.Should().Contain("LEFT JOIN dbo.AgentResultEnrichments");
        sql.Should().Contain("INNER JOIN dbo.Runs");
        sql.Should().Contain("ar.ProposedEvidenceJson IS NOT NULL");
        sql.Should().Contain("TenantCuratedEvidenceEntries");
    }

    [Fact]
    public void List_evidence_proposals_excludes_already_promoted_rows()
    {
        string sql = AgentResultStatementFactory.BuildListEvidenceProposals();

        sql.Should().Contain("ar.EvidenceProposalPromotedUtc IS NULL");
        sql.Should().Contain("enr.EvidenceProposalPromotedUtc IS NULL");
        sql.Should().Contain("CAST(0 AS BIT) AS IsPromoted");
        sql.Should().Contain("ORDER BY ar.CreatedUtc DESC;");
    }

    /// <summary>
    ///     The single-proposal read keeps promoted rows so callers can render "already promoted" rather than a 404.
    /// </summary>
    [Fact]
    public void Single_evidence_proposal_read_computes_the_promoted_flag()
    {
        string sql = AgentResultStatementFactory.BuildSelectEvidenceProposalByResultId();

        sql.Should().Contain("SELECT TOP (1)");
        sql.Should().Contain("THEN CAST(1 AS BIT)");
        sql.Should().Contain("ELSE CAST(0 AS BIT)");
        sql.Should().Contain("WHERE ar.ResultId = @ResultId");
    }

    [Fact]
    public void Rollup_projection_read_never_selects_the_bare_result_json_column()
    {
        string sql = AgentResultStatementFactory.BuildSelectRollupProjectionByRunId();

        sql.Should().Contain("JSON_QUERY(ar.ResultJson, '$.findings')");
        sql.Should().NotContain("SELECT ar.ResultJson");
    }
}
