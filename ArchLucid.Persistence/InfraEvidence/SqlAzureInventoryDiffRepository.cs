using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAzureInventoryDiffRepository(ISqlConnectionFactory connectionFactory) : IAzureInventoryDiffRepository
{
    public async Task<AzureInventoryDiffSummaryRecord?> TryGetBySnapshotPairAsync(
        ScopeContext scope,
        Guid snapshotAId,
        Guid snapshotBId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT TOP (1)
                               DiffId, SnapshotAId, SnapshotBId, SubscriptionId, TotalChanges,
                               ResourceAddedCount, ResourceRemovedCount, ResourceModifiedCount,
                               NetworkExposureChangeCount, PermissionChangeCount, LoggingRegressionCount,
                               NewPrivateEndpointCount, RelationshipRemovedCount, CreatedUtc
                           FROM dbo.AzureInventoryDiffs
                           WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND SnapshotAId = @SnapshotAId
                               AND SnapshotBId = @SnapshotBId;
                           """;

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.QuerySingleOrDefaultAsync<AzureInventoryDiffSummaryRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotAId = snapshotAId,
                    SnapshotBId = snapshotBId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<AzureInventoryDiffPersistResult> InsertDiffAsync(
        ScopeContext scope,
        AzureInventoryDiffPersistRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        AzureInventoryDiffSummaryRecord? existing =
            await TryGetBySnapshotPairAsync(scope, request.SnapshotAId, request.SnapshotBId, cancellationToken);

        if (existing is not null)
        {
            return new AzureInventoryDiffPersistResult
            {
                WasExisting = true,
                DiffId = existing.DiffId,
                Summary = existing,
            };
        }

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Diff persist requires SqlConnection.");

        using IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            const string insertDiff = """
                                      INSERT INTO dbo.AzureInventoryDiffs
                                      (
                                          DiffId, TenantId, WorkspaceId, ProjectId, SnapshotAId, SnapshotBId,
                                          SubscriptionId, TotalChanges, ResourceAddedCount, ResourceRemovedCount,
                                          ResourceModifiedCount, NetworkExposureChangeCount, PermissionChangeCount,
                                          LoggingRegressionCount, NewPrivateEndpointCount, RelationshipRemovedCount,
                                          CreatedUtc
                                      )
                                      VALUES
                                      (
                                          @DiffId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotAId, @SnapshotBId,
                                          @SubscriptionId, @TotalChanges, @ResourceAddedCount, @ResourceRemovedCount,
                                          @ResourceModifiedCount, @NetworkExposureChangeCount, @PermissionChangeCount,
                                          @LoggingRegressionCount, @NewPrivateEndpointCount, @RelationshipRemovedCount,
                                          @CreatedUtc
                                      );
                                      """;

            AzureInventoryDiffSummaryRecord summary = request.Summary;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    insertDiff,
                    new
                    {
                        request.DiffId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        request.SnapshotAId,
                        request.SnapshotBId,
                        request.SubscriptionId,
                        summary.TotalChanges,
                        summary.ResourceAddedCount,
                        summary.ResourceRemovedCount,
                        summary.ResourceModifiedCount,
                        summary.NetworkExposureChangeCount,
                        summary.PermissionChangeCount,
                        summary.LoggingRegressionCount,
                        summary.NewPrivateEndpointCount,
                        summary.RelationshipRemovedCount,
                        CreatedUtc = utcNow,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (request.Changes.Count > 0)
            {
                const string insertChange = """
                                            INSERT INTO dbo.AzureInventoryChanges
                                            (
                                                ChangeId, DiffId, TenantId, SnapshotAId, SnapshotBId,
                                                CloudResourceId, AzureResourceId, ChangeType, Property,
                                                OldValue, NewValue, RiskClassification, ArchitectureSignificance,
                                                SecuritySignificance, Confidence, EvidenceReference, ProvenanceKind
                                            )
                                            VALUES
                                            (
                                                @ChangeId, @DiffId, @TenantId, @SnapshotAId, @SnapshotBId,
                                                @CloudResourceId, @AzureResourceId, @ChangeType, @Property,
                                                @OldValue, @NewValue, @RiskClassification, @ArchitectureSignificance,
                                                @SecuritySignificance, @Confidence, @EvidenceReference, @ProvenanceKind
                                            );
                                            """;

                foreach (AzureInventoryChangeRecord change in request.Changes)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertChange,
                            new
                            {
                                change.ChangeId,
                                request.DiffId,
                                scope.TenantId,
                                change.SnapshotAId,
                                change.SnapshotBId,
                                change.CloudResourceId,
                                change.AzureResourceId,
                                ChangeType = (int)change.ChangeType,
                                change.Property,
                                change.OldValue,
                                change.NewValue,
                                change.RiskClassification,
                                change.ArchitectureSignificance,
                                change.SecuritySignificance,
                                change.Confidence,
                                change.EvidenceReference,
                                ProvenanceKind = (int)change.ProvenanceKind,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            tx.Commit();

            return new AzureInventoryDiffPersistResult
            {
                WasExisting = false,
                DiffId = request.DiffId,
                Summary = new AzureInventoryDiffSummaryRecord
                {
                    DiffId = summary.DiffId,
                    SnapshotAId = summary.SnapshotAId,
                    SnapshotBId = summary.SnapshotBId,
                    SubscriptionId = summary.SubscriptionId,
                    TotalChanges = summary.TotalChanges,
                    ResourceAddedCount = summary.ResourceAddedCount,
                    ResourceRemovedCount = summary.ResourceRemovedCount,
                    ResourceModifiedCount = summary.ResourceModifiedCount,
                    NetworkExposureChangeCount = summary.NetworkExposureChangeCount,
                    PermissionChangeCount = summary.PermissionChangeCount,
                    LoggingRegressionCount = summary.LoggingRegressionCount,
                    NewPrivateEndpointCount = summary.NewPrivateEndpointCount,
                    RelationshipRemovedCount = summary.RelationshipRemovedCount,
                    CreatedUtc = utcNow,
                },
            };
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<IReadOnlyList<AzureInventoryChangeRecord>> ListChangesByDiffIdAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ChangeId, DiffId, SnapshotAId, SnapshotBId, CloudResourceId, AzureResourceId,
                                  ChangeType, Property, OldValue, NewValue, RiskClassification,
                                  ArchitectureSignificance, SecuritySignificance, Confidence, EvidenceReference,
                                  ProvenanceKind
                           FROM dbo.AzureInventoryChanges
                           WHERE TenantId = @TenantId AND DiffId = @DiffId
                           ORDER BY AzureResourceId, ChangeType, Property;
                           """;

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ChangeRow> rows = await conn.QueryAsync<ChangeRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, DiffId = diffId },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => new AzureInventoryChangeRecord
            {
                ChangeId = r.ChangeId,
                DiffId = r.DiffId,
                SnapshotAId = r.SnapshotAId,
                SnapshotBId = r.SnapshotBId,
                CloudResourceId = r.CloudResourceId,
                AzureResourceId = r.AzureResourceId,
                ChangeType = (AzureInventoryChangeType)r.ChangeType,
                Property = r.Property,
                OldValue = r.OldValue,
                NewValue = r.NewValue,
                RiskClassification = r.RiskClassification,
                ArchitectureSignificance = r.ArchitectureSignificance,
                SecuritySignificance = r.SecuritySignificance,
                Confidence = r.Confidence,
                EvidenceReference = r.EvidenceReference,
                ProvenanceKind = (ProvenanceKind)r.ProvenanceKind,
            })
            .ToList();
    }

    private sealed class ChangeRow
    {
        public Guid ChangeId
        {
            get;
            init;
        }

        public Guid DiffId
        {
            get;
            init;
        }

        public Guid SnapshotAId
        {
            get;
            init;
        }

        public Guid SnapshotBId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string? AzureResourceId
        {
            get;
            init;
        }

        public int ChangeType
        {
            get;
            init;
        }

        public string? Property
        {
            get;
            init;
        }

        public string? OldValue
        {
            get;
            init;
        }

        public string? NewValue
        {
            get;
            init;
        }

        public string? RiskClassification
        {
            get;
            init;
        }

        public string? ArchitectureSignificance
        {
            get;
            init;
        }

        public string? SecuritySignificance
        {
            get;
            init;
        }

        public decimal? Confidence
        {
            get;
            init;
        }

        public string? EvidenceReference
        {
            get;
            init;
        }

        public int ProvenanceKind
        {
            get;
            init;
        }
    }
}
