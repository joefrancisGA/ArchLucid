using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    public async Task<AzureInventoryDefenderBandContextReadModel?> TryGetDefenderBandContextAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
            return null;

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
            return null;

        const string defenderSql = """
                                   SELECT ResourceId, SecureScore, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderSummaries
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT SubscriptionId, AssessmentKey, DisplayName, Severity, Status, StatusCause,
                                          Category, ResourceId, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderAssessments
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT SubscriptionId, ScoreName, ControlName, DisplayName, CurrentScore, MaxScore,
                                          Percentage, Weight, UnhealthyResourceCount, HealthyResourceCount, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderScoreControls
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT CloudResourceId, AzureResourceId
                                   FROM dbo.AzureInventoryResources
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId
                                     AND CloudResourceId IS NOT NULL;

                                   SELECT SubscriptionId, AlertId, DisplayName, Severity, Status, Intent, AlertType,
                                          StartTimeUtc, ResourceId, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderAlerts
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT SubscriptionId, AttackPathId, DisplayName, RiskLevel, EntryResourceIds,
                                          TargetResourceIds, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderAttackPaths
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT SubscriptionId, ResourceId, CriticalCount, HighCount, MediumCount, LowCount,
                                          SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderVulnerabilityCounts
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;

                                   SELECT SubscriptionId, AssessmentKey, ResourceId, Owner, RemediationDueUtc,
                                          IsGracePeriod, AssignmentStatus, SourceEvidenceReference
                                   FROM dbo.AzureInventoryDefenderGovernanceAssignments
                                   WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                   """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        using SqlMapper.GridReader reader = await conn.QueryMultipleAsync(
            new CommandDefinition(
                defenderSql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        List<AzureInventoryDefenderSummaryReadModel> defenderRows =
            (await reader.ReadAsync<AzureInventoryDefenderSummaryReadModel>()).ToList();
        List<AzureInventoryDefenderAssessmentReadModel> assessments =
            (await reader.ReadAsync<AzureInventoryDefenderAssessmentReadModel>()).ToList();
        List<AzureInventoryDefenderScoreControlReadModel> scoreControls =
            (await reader.ReadAsync<AzureInventoryDefenderScoreControlReadModel>()).ToList();
        List<AzureInventoryDefenderResourceRefReadModel> resources =
            (await reader.ReadAsync<AzureInventoryDefenderResourceRefReadModel>()).ToList();
        List<AzureInventoryDefenderAlertReadModel> alerts =
            (await reader.ReadAsync<AzureInventoryDefenderAlertReadModel>()).ToList();
        List<AzureInventoryDefenderAttackPathReadModel> attackPaths =
            (await reader.ReadAsync<AzureInventoryDefenderAttackPathReadModel>()).ToList();
        List<AzureInventoryDefenderVulnerabilityCountReadModel> vulnerabilityCounts =
            (await reader.ReadAsync<AzureInventoryDefenderVulnerabilityCountReadModel>()).ToList();
        List<AzureInventoryDefenderGovernanceAssignmentReadModel> governanceAssignments =
            (await reader.ReadAsync<AzureInventoryDefenderGovernanceAssignmentReadModel>()).ToList();

        return new AzureInventoryDefenderBandContextReadModel
        {
            SubscriptionId = header.SubscriptionId,
            DefenderSummaries = defenderRows,
            DefenderAssessments = assessments,
            DefenderScoreControls = scoreControls,
            Resources = resources,
            DefenderAlerts = alerts,
            DefenderAttackPaths = attackPaths,
            DefenderVulnerabilityCounts = vulnerabilityCounts,
            DefenderGovernanceAssignments = governanceAssignments,
        };
    }

    public async Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourceVisibilityRowsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
            return null;

        const string sql = """
                           SELECT AzureResourceId, ResourceType
                           FROM dbo.AzureInventoryResources
                           WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryResourceRecord> rows = await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<AzureInventoryResourceRecord>> ListResourcesByCloudResourceIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(cloudResourceIds);

        List<Guid> ids = cloudResourceIds.Where(id => id != Guid.Empty).Distinct().ToList();

        if (ids.Count == 0 || snapshotId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT ResourceRowId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                  ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId,
                                  SourceEvidenceReference
                           FROM dbo.AzureInventoryResources
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND CloudResourceId IN @CloudResourceIds;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryResourceRecord> rows = await conn.QueryAsync<AzureInventoryResourceRecord>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, SnapshotId = snapshotId, CloudResourceIds = ids },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<AzureInventoryTagReadModel>> ListTagsByResourceRowIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> resourceRowIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(resourceRowIds);

        List<Guid> ids = resourceRowIds.Where(id => id != Guid.Empty).Distinct().ToList();

        if (ids.Count == 0 || snapshotId == Guid.Empty)
            return [];

        const string sql = """
                           SELECT ResourceRowId, TagKey, TagValue
                           FROM dbo.AzureInventoryTags
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                             AND ResourceRowId IN @ResourceRowIds;
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AzureInventoryTagReadModel> rows = await conn.QueryAsync<AzureInventoryTagReadModel>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, SnapshotId = snapshotId, ResourceRowIds = ids },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
