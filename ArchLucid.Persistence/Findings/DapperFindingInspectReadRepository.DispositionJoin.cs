using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

public sealed partial class DapperFindingInspectReadRepository
{
    private sealed class DispositionJoinResult
    {
        public List<string> RelatedNodes
        {
            get;
            init;
        } = [];

        public string? FirstRuleText
        {
            get;
            init;
        }

        public List<string> RecommendedActions
        {
            get;
            init;
        } = [];

        public Guid? AuditRowId
        {
            get;
            init;
        }

        public DispositionRow? DispositionRow
        {
            get;
            init;
        }

        public long ActiveWaiverCount
        {
            get;
            init;
        }
    }

    private async Task<DispositionJoinResult> LoadDispositionJoinAsync(
        SqlConnection connection,
        ScopeContext scope,
        string findingId,
        MainRow row,
        CancellationToken ct)
    {
        object queryParams = new
        {
            FindingId = findingId.Trim(),
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            row.RunId,
            EventType = AuditEventTypes.AuthorityCommittedChainPersisted,
            ActiveStatus = "Active",
        };

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(FindingInspectReadSql.FollowUpBatch, queryParams, cancellationToken: ct));

        List<string> relatedNodes = (await multi.ReadAsync<string>()).ToList();
        string? firstRuleText = await multi.ReadSingleOrDefaultAsync<string>();

        List<string> recommendedActions = (await multi.ReadAsync<string>())
            .Where(static a => !string.IsNullOrWhiteSpace(a))
            .ToList();

        Guid? auditRowId = await multi.ReadSingleOrDefaultAsync<Guid?>();
        DispositionRow? dispositionRow = await multi.ReadSingleOrDefaultAsync<DispositionRow>();
        long activeWaiverCount = await multi.ReadSingleAsync<long>();

        return new DispositionJoinResult
        {
            RelatedNodes = relatedNodes,
            FirstRuleText = firstRuleText,
            RecommendedActions = recommendedActions,
            AuditRowId = auditRowId,
            DispositionRow = dispositionRow,
            ActiveWaiverCount = activeWaiverCount,
        };
    }
}
