using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturePostureReadSqlTests
{
    [Fact]
    public void ReadPostureBatch_scopes_latest_snapshot_and_findings_to_scope_triple()
    {
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fs.TenantId = @TenantId");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fs.WorkspaceId = @WorkspaceId");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fs.ProjectId = @ProjectId");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fr.TenantId = @TenantId");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fr.WorkspaceId = @WorkspaceId");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("fr.ProjectId = @ProjectId");
    }

    [Fact]
    public void ReadPostureBatch_scopes_latest_disposition_to_scope_triple()
    {
        string dispositionSql = ExtractStatementContaining(
            ArchitecturePostureReadSql.ReadPostureBatch,
            "FROM dbo.FindingReviewEvents");

        dispositionSql.Should().Contain("fre.TenantId = @TenantId");
        dispositionSql.Should().Contain("fre.WorkspaceId = @WorkspaceId");
        dispositionSql.Should().Contain("fre.ProjectId = @ProjectId");
    }

    [Fact]
    public void ReadPostureBatch_limits_findings_to_latest_snapshot()
    {
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("latestSnapshot");
        ArchitecturePostureReadSql.ReadPostureBatch.Should().Contain("ORDER BY fs.CreatedUtc DESC");
    }

    private static string ExtractStatementContaining(string batch, string marker)
    {
        string[] statements = batch.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string? match = statements.FirstOrDefault(statement => statement.Contains(marker, StringComparison.Ordinal));

        match.Should().NotBeNull($"expected a statement containing '{marker}'");

        return match!;
    }
}
