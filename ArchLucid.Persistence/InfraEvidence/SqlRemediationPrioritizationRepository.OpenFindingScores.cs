using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationPrioritizationRepository
{
    public async Task<decimal> SumTotalScoresForOpenFindingsInScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT COALESCE(SUM(COALESCE(s.TotalScore, 0)), 0)
                           FROM dbo.OperationalSecurityFindings f
                           LEFT JOIN dbo.RemediationPrioritizationScores s
                               ON s.TenantId = f.TenantId
                               AND s.FindingId = f.FindingId
                           WHERE f.TenantId = @TenantId
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                             AND f.Status IN (@OpenStatus, @RecurredStatus);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<decimal>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    OpenStatus = (int)OperationalSecurityFindingStatus.Open,
                    RecurredStatus = (int)OperationalSecurityFindingStatus.Recurred,
                },
                cancellationToken: cancellationToken));
    }
}
