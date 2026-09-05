using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlOperationalSecurityFindingRepository(ISqlConnectionFactory connectionFactory)
    : IOperationalSecurityFindingRepository
{
    public async Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
        Guid tenantId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                                  CloudResourceId, ExternalResourceId, ResourceType, SubscriptionOrAccountId,
                                  ControlId, ControlFramework, Title, Description, Severity, RiskScore,
                                  Exploitability, Exposure, BusinessCriticality, BlastRadius,
                                  FirstObservedUtc, LastObservedUtc, Status, RawEvidenceReference,
                                  AssessmentId, InventoryDiffId, AuditEvidenceSnapshotId,
                                  PayloadHashSha256, CreatedUtc, UpdatedUtc
                           FROM dbo.OperationalSecurityFindings
                           WHERE TenantId = @TenantId
                             AND Provider = @Provider
                             AND SourceSystem = @SourceSystem
                             AND SourceFindingId = @SourceFindingId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        FindingRow? row = await conn.QuerySingleOrDefaultAsync<FindingRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Provider = (int)provider,
                    SourceSystem = sourceSystem,
                    SourceFindingId = sourceFindingId,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : MapFinding(row);
    }

    public async Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                                  CloudResourceId, ExternalResourceId, ResourceType, SubscriptionOrAccountId,
                                  ControlId, ControlFramework, Title, Description, Severity, RiskScore,
                                  Exploitability, Exposure, BusinessCriticality, BlastRadius,
                                  FirstObservedUtc, LastObservedUtc, Status, RawEvidenceReference,
                                  AssessmentId, InventoryDiffId, AuditEvidenceSnapshotId,
                                  PayloadHashSha256, CreatedUtc, UpdatedUtc
                           FROM dbo.OperationalSecurityFindings
                           WHERE TenantId = @TenantId AND FindingId = @FindingId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        FindingRow? row = await conn.QuerySingleOrDefaultAsync<FindingRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapFinding(row);
    }

    public async Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
        Guid tenantId,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                                  CloudResourceId, ExternalResourceId, ResourceType, SubscriptionOrAccountId,
                                  ControlId, ControlFramework, Title, Description, Severity, RiskScore,
                                  Exploitability, Exposure, BusinessCriticality, BlastRadius,
                                  FirstObservedUtc, LastObservedUtc, Status, RawEvidenceReference,
                                  AssessmentId, InventoryDiffId, AuditEvidenceSnapshotId,
                                  PayloadHashSha256, CreatedUtc, UpdatedUtc
                           FROM dbo.OperationalSecurityFindings
                           WHERE TenantId = @TenantId
                             AND (@Status IS NULL OR Status = @Status)
                           ORDER BY LastObservedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<FindingRow> rows = await conn.QueryAsync<FindingRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Status = status.HasValue ? (int?)status.Value : null,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapFinding).ToList();
    }

    public async Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT MetadataRowId, FindingId, TenantId, MetadataKey, MetadataValue
                           FROM dbo.OperationalSecurityFindingMetadata
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY MetadataKey;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<MetadataRow> rows = await conn.QueryAsync<MetadataRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return rows.Select(MapMetadata).ToList();
    }

    public async Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ObservationId, FindingId, TenantId, ObservedUtc, Status, Severity, RiskScore,
                                  Summary, PayloadHashSha256, SourceSystem
                           FROM dbo.OperationalSecurityFindingObservations
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY ObservedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ObservationRow> rows = await conn.QueryAsync<ObservationRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return rows.Select(MapObservation).ToList();
    }

    public async Task InsertAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord observation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(observation);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        try
        {
            await InsertFindingAsync(conn, tx, finding, cancellationToken);
            await UpsertMetadataAsync(conn, tx, metadata, cancellationToken);
            await InsertObservationAsync(conn, tx, observation, cancellationToken);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task UpdateAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord? observation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finding);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        try
        {
            await UpdateFindingAsync(conn, tx, finding, cancellationToken);
            await UpsertMetadataAsync(conn, tx, metadata, cancellationToken);

            if (observation is not null)
                await InsertObservationAsync(conn, tx, observation, cancellationToken);

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static async Task InsertFindingAsync(
        System.Data.IDbConnection conn,
        System.Data.IDbTransaction tx,
        OperationalSecurityFindingRecord finding,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.OperationalSecurityFindings
                           (
                               FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId,
                               CloudResourceId, ExternalResourceId, ResourceType, SubscriptionOrAccountId,
                               ControlId, ControlFramework, Title, Description, Severity, RiskScore,
                               Exploitability, Exposure, BusinessCriticality, BlastRadius,
                               FirstObservedUtc, LastObservedUtc, Status, RawEvidenceReference,
                               AssessmentId, InventoryDiffId, AuditEvidenceSnapshotId,
                               PayloadHashSha256, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @FindingId, @TenantId, @WorkspaceId, @ProjectId, @Provider, @SourceSystem, @SourceFindingId,
                               @CloudResourceId, @ExternalResourceId, @ResourceType, @SubscriptionOrAccountId,
                               @ControlId, @ControlFramework, @Title, @Description, @Severity, @RiskScore,
                               @Exploitability, @Exposure, @BusinessCriticality, @BlastRadius,
                               @FirstObservedUtc, @LastObservedUtc, @Status, @RawEvidenceReference,
                               @AssessmentId, @InventoryDiffId, @AuditEvidenceSnapshotId,
                               @PayloadHashSha256, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                MapFindingParameters(finding),
                tx,
                cancellationToken: cancellationToken));
    }

    private static async Task UpdateFindingAsync(
        System.Data.IDbConnection conn,
        System.Data.IDbTransaction tx,
        OperationalSecurityFindingRecord finding,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.OperationalSecurityFindings
                           SET CloudResourceId = @CloudResourceId,
                               ExternalResourceId = @ExternalResourceId,
                               ResourceType = @ResourceType,
                               SubscriptionOrAccountId = @SubscriptionOrAccountId,
                               ControlId = @ControlId,
                               ControlFramework = @ControlFramework,
                               Title = @Title,
                               Description = @Description,
                               Severity = @Severity,
                               RiskScore = @RiskScore,
                               Exploitability = @Exploitability,
                               Exposure = @Exposure,
                               BusinessCriticality = @BusinessCriticality,
                               BlastRadius = @BlastRadius,
                               LastObservedUtc = @LastObservedUtc,
                               Status = @Status,
                               RawEvidenceReference = @RawEvidenceReference,
                               AssessmentId = @AssessmentId,
                               InventoryDiffId = @InventoryDiffId,
                               AuditEvidenceSnapshotId = @AuditEvidenceSnapshotId,
                               PayloadHashSha256 = @PayloadHashSha256,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId AND FindingId = @FindingId;
                           """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                MapFindingParameters(finding),
                tx,
                cancellationToken: cancellationToken));
    }

    private static async Task UpsertMetadataAsync(
        System.Data.IDbConnection conn,
        System.Data.IDbTransaction tx,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        CancellationToken cancellationToken)
    {
        if (metadata.Count == 0)
            return;

        const string sql = """
                           MERGE dbo.OperationalSecurityFindingMetadata AS target
                           USING (SELECT @MetadataRowId AS MetadataRowId, @FindingId AS FindingId, @TenantId AS TenantId,
                                         @MetadataKey AS MetadataKey, @MetadataValue AS MetadataValue) AS source
                           ON target.TenantId = source.TenantId
                              AND target.FindingId = source.FindingId
                              AND target.MetadataKey = source.MetadataKey
                           WHEN MATCHED THEN
                               UPDATE SET MetadataValue = source.MetadataValue
                           WHEN NOT MATCHED THEN
                               INSERT (MetadataRowId, FindingId, TenantId, MetadataKey, MetadataValue)
                               VALUES (source.MetadataRowId, source.FindingId, source.TenantId, source.MetadataKey, source.MetadataValue);
                           """;

        foreach (OperationalSecurityFindingMetadataRecord row in metadata)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    row,
                    tx,
                    cancellationToken: cancellationToken));
        }
    }

    private static async Task InsertObservationAsync(
        System.Data.IDbConnection conn,
        System.Data.IDbTransaction tx,
        OperationalSecurityFindingObservationRecord observation,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.OperationalSecurityFindingObservations
                           (
                               ObservationId, FindingId, TenantId, ObservedUtc, Status, Severity, RiskScore,
                               Summary, PayloadHashSha256, SourceSystem
                           )
                           VALUES
                           (
                               @ObservationId, @FindingId, @TenantId, @ObservedUtc, @Status, @Severity, @RiskScore,
                               @Summary, @PayloadHashSha256, @SourceSystem
                           );
                           """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    observation.ObservationId,
                    observation.FindingId,
                    observation.TenantId,
                    observation.ObservedUtc,
                    Status = (int)observation.Status,
                    observation.Severity,
                    observation.RiskScore,
                    observation.Summary,
                    observation.PayloadHashSha256,
                    observation.SourceSystem,
                },
                tx,
                cancellationToken: cancellationToken));
    }

    private static object MapFindingParameters(OperationalSecurityFindingRecord finding) =>
        new
        {
            finding.FindingId,
            finding.TenantId,
            finding.WorkspaceId,
            finding.ProjectId,
            Provider = (int)finding.Provider,
            finding.SourceSystem,
            finding.SourceFindingId,
            finding.CloudResourceId,
            finding.ExternalResourceId,
            finding.ResourceType,
            finding.SubscriptionOrAccountId,
            finding.ControlId,
            finding.ControlFramework,
            finding.Title,
            finding.Description,
            finding.Severity,
            finding.RiskScore,
            finding.Exploitability,
            finding.Exposure,
            finding.BusinessCriticality,
            finding.BlastRadius,
            finding.FirstObservedUtc,
            finding.LastObservedUtc,
            Status = (int)finding.Status,
            finding.RawEvidenceReference,
            finding.AssessmentId,
            finding.InventoryDiffId,
            finding.AuditEvidenceSnapshotId,
            finding.PayloadHashSha256,
            finding.CreatedUtc,
            finding.UpdatedUtc,
        };

    private static OperationalSecurityFindingRecord MapFinding(FindingRow row) =>
        new()
        {
            FindingId = row.FindingId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Provider = (CloudProvider)row.Provider,
            SourceSystem = row.SourceSystem,
            SourceFindingId = row.SourceFindingId,
            CloudResourceId = row.CloudResourceId,
            ExternalResourceId = row.ExternalResourceId,
            ResourceType = row.ResourceType,
            SubscriptionOrAccountId = row.SubscriptionOrAccountId,
            ControlId = row.ControlId,
            ControlFramework = row.ControlFramework,
            Title = row.Title,
            Description = row.Description,
            Severity = row.Severity,
            RiskScore = row.RiskScore,
            Exploitability = row.Exploitability,
            Exposure = row.Exposure,
            BusinessCriticality = row.BusinessCriticality,
            BlastRadius = row.BlastRadius,
            FirstObservedUtc = row.FirstObservedUtc,
            LastObservedUtc = row.LastObservedUtc,
            Status = (OperationalSecurityFindingStatus)row.Status,
            RawEvidenceReference = row.RawEvidenceReference,
            AssessmentId = row.AssessmentId,
            InventoryDiffId = row.InventoryDiffId,
            AuditEvidenceSnapshotId = row.AuditEvidenceSnapshotId,
            PayloadHashSha256 = row.PayloadHashSha256,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private static OperationalSecurityFindingMetadataRecord MapMetadata(MetadataRow row) =>
        new()
        {
            MetadataRowId = row.MetadataRowId,
            FindingId = row.FindingId,
            TenantId = row.TenantId,
            MetadataKey = row.MetadataKey,
            MetadataValue = row.MetadataValue,
        };

    private static OperationalSecurityFindingObservationRecord MapObservation(ObservationRow row) =>
        new()
        {
            ObservationId = row.ObservationId,
            FindingId = row.FindingId,
            TenantId = row.TenantId,
            ObservedUtc = row.ObservedUtc,
            Status = (OperationalSecurityFindingStatus)row.Status,
            Severity = row.Severity,
            RiskScore = row.RiskScore,
            Summary = row.Summary,
            PayloadHashSha256 = row.PayloadHashSha256,
            SourceSystem = row.SourceSystem,
        };

    private sealed class FindingRow
    {
        public Guid FindingId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public int Provider
        {
            get;
            init;
        }

        public string SourceSystem
        {
            get;
            init;
        } = string.Empty;

        public string SourceFindingId
        {
            get;
            init;
        } = string.Empty;

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string? ExternalResourceId
        {
            get;
            init;
        }

        public string? ResourceType
        {
            get;
            init;
        }

        public string? SubscriptionOrAccountId
        {
            get;
            init;
        }

        public string? ControlId
        {
            get;
            init;
        }

        public string? ControlFramework
        {
            get;
            init;
        }

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string? Description
        {
            get;
            init;
        }

        public string? Severity
        {
            get;
            init;
        }

        public decimal? RiskScore
        {
            get;
            init;
        }

        public string? Exploitability
        {
            get;
            init;
        }

        public string? Exposure
        {
            get;
            init;
        }

        public string? BusinessCriticality
        {
            get;
            init;
        }

        public string? BlastRadius
        {
            get;
            init;
        }

        public DateTime FirstObservedUtc
        {
            get;
            init;
        }

        public DateTime LastObservedUtc
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public string? RawEvidenceReference
        {
            get;
            init;
        }

        public Guid? AssessmentId
        {
            get;
            init;
        }

        public Guid? InventoryDiffId
        {
            get;
            init;
        }

        public Guid? AuditEvidenceSnapshotId
        {
            get;
            init;
        }

        public byte[] PayloadHashSha256
        {
            get;
            init;
        } = [];

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }

    private sealed class MetadataRow
    {
        public Guid MetadataRowId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string MetadataKey
        {
            get;
            init;
        } = string.Empty;

        public string? MetadataValue
        {
            get;
            init;
        }
    }

    private sealed class ObservationRow
    {
        public Guid ObservationId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public DateTime ObservedUtc
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public string? Severity
        {
            get;
            init;
        }

        public decimal? RiskScore
        {
            get;
            init;
        }

        public string? Summary
        {
            get;
            init;
        }

        public byte[] PayloadHashSha256
        {
            get;
            init;
        } = [];

        public string SourceSystem
        {
            get;
            init;
        } = string.Empty;
    }
}
