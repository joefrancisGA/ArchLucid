using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyList<Guid> findingIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findingIds);

        if (findingIds.Count == 0)
            return [];

        List<Guid> distinctFindingIds = findingIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctFindingIds.Count == 0)
            return [];

        const string sql = """
                           SELECT FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                                  CloudResourceId, ExternalResourceId, ResourceType, SubscriptionOrAccountId,
                                  ControlId, ControlFramework, Title, Description, Severity, RiskScore,
                                  Exploitability, Exposure, BusinessCriticality, BlastRadius,
                                  FirstObservedUtc, LastObservedUtc, Status, RawEvidenceReference,
                                  AssessmentId, InventoryDiffId, AuditEvidenceSnapshotId, PathId,
                                  PayloadHashSha256, CreatedUtc, UpdatedUtc
                           FROM dbo.OperationalSecurityFindings
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND FindingId IN @FindingIds;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<FindingRow> rows = await conn.QueryAsync<FindingRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    FindingIds = distinctFindingIds,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapFinding).ToList();
    }
}
