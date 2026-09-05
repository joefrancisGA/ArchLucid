using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditEvidenceSnapshotRepository(ISqlConnectionFactory connectionFactory)
    : IAuditEvidenceSnapshotRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task InsertSnapshotAsync(AuditEvidenceSnapshotPersistRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Header);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Audit evidence snapshot persist requires SqlConnection.");

        using System.Data.IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            AuditEvidenceSnapshotHeaderRecord header = request.Header;

            const string insertHeader = """
                                        INSERT INTO dbo.AuditEvidenceSnapshots
                                        (
                                            AuditEvidenceSnapshotId, AssessmentId, TenantId, SubscriptionIdsJson,
                                            CollectionStartedUtc, CollectionCompletedUtc, SelectorVersionsJson,
                                            FrameworkVersion, ControlCatalogVersion, Completeness, FailuresJson,
                                            WarningsJson, EvidenceHashSha256, CreatedUtc
                                        )
                                        VALUES
                                        (
                                            @AuditEvidenceSnapshotId, @AssessmentId, @TenantId, @SubscriptionIdsJson,
                                            @CollectionStartedUtc, @CollectionCompletedUtc, @SelectorVersionsJson,
                                            @FrameworkVersion, @ControlCatalogVersion, @Completeness, @FailuresJson,
                                            @WarningsJson, @EvidenceHashSha256, @CreatedUtc
                                        );
                                        """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    insertHeader,
                    new
                    {
                        header.AuditEvidenceSnapshotId,
                        header.AssessmentId,
                        header.TenantId,
                        SubscriptionIdsJson = JsonSerializer.Serialize(header.SubscriptionIds, JsonOptions),
                        header.CollectionStartedUtc,
                        header.CollectionCompletedUtc,
                        header.SelectorVersionsJson,
                        header.FrameworkVersion,
                        header.ControlCatalogVersion,
                        header.Completeness,
                        FailuresJson = JsonSerializer.Serialize(header.Failures, JsonOptions),
                        WarningsJson = JsonSerializer.Serialize(header.Warnings, JsonOptions),
                        header.EvidenceHashSha256,
                        header.CreatedUtc,
                    },
                    transaction: tx,
                    commandTimeout: DapperCommandTimeoutSeconds.Report,
                    cancellationToken: cancellationToken));

            if (header.InventorySnapshotIds.Count > 0)
            {
                const string insertLink = """
                                          INSERT INTO dbo.AuditEvidenceSnapshotInventoryLinks
                                          (LinkId, AuditEvidenceSnapshotId, AzureInventorySnapshotId, TenantId)
                                          VALUES (@LinkId, @AuditEvidenceSnapshotId, @AzureInventorySnapshotId, @TenantId);
                                          """;

                foreach (Guid inventorySnapshotId in header.InventorySnapshotIds)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertLink,
                            new
                            {
                                LinkId = Guid.NewGuid(),
                                header.AuditEvidenceSnapshotId,
                                AzureInventorySnapshotId = inventorySnapshotId,
                                header.TenantId,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            if (request.Items.Count > 0)
            {
                const string insertItem = """
                                          INSERT INTO dbo.AuditEvidenceSnapshotItems
                                          (
                                              EvidenceRowId, AuditEvidenceSnapshotId, RequirementId, TenantId,
                                              CloudResourceId, AzureResourceId, EvidenceType, CollectedUtc,
                                              CollectorVersion, NormalizedPointer, RawPointer, EvidenceHashSha256,
                                              CollectionStatus, FreshnessStatus, Confidence, Summary, ProvenanceKind,
                                              SelectorVersion, AzureScope, ApiQueryId
                                          )
                                          VALUES
                                          (
                                              @EvidenceRowId, @AuditEvidenceSnapshotId, @RequirementId, @TenantId,
                                              @CloudResourceId, @AzureResourceId, @EvidenceType, @CollectedUtc,
                                              @CollectorVersion, @NormalizedPointer, @RawPointer, @EvidenceHashSha256,
                                              @CollectionStatus, @FreshnessStatus, @Confidence, @Summary, @ProvenanceKind,
                                              @SelectorVersion, @AzureScope, @ApiQueryId
                                          );
                                          """;

                foreach (AuditEvidenceSnapshotItemRecord item in request.Items)
                {
                    await sqlConn.ExecuteAsync(
                        new CommandDefinition(
                            insertItem,
                            new
                            {
                                item.EvidenceRowId,
                                item.AuditEvidenceSnapshotId,
                                item.RequirementId,
                                item.TenantId,
                                item.CloudResourceId,
                                item.AzureResourceId,
                                item.EvidenceType,
                                item.CollectedUtc,
                                item.CollectorVersion,
                                item.NormalizedPointer,
                                item.RawPointer,
                                item.EvidenceHashSha256,
                                CollectionStatus = (int)item.CollectionStatus,
                                FreshnessStatus = (int)item.FreshnessStatus,
                                item.Confidence,
                                item.Summary,
                                ProvenanceKind = (int)item.ProvenanceKind,
                                item.SelectorVersion,
                                item.AzureScope,
                                item.ApiQueryId,
                            },
                            transaction: tx,
                            commandTimeout: DapperCommandTimeoutSeconds.Report,
                            cancellationToken: cancellationToken));
                }
            }

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<AuditEvidenceSnapshotHeaderRecord?> TryGetHeaderAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AuditEvidenceSnapshotId, AssessmentId, TenantId, SubscriptionIdsJson,
                                  CollectionStartedUtc, CollectionCompletedUtc, SelectorVersionsJson,
                                  FrameworkVersion, ControlCatalogVersion, Completeness, FailuresJson,
                                  WarningsJson, EvidenceHashSha256, CreatedUtc
                           FROM dbo.AuditEvidenceSnapshots
                           WHERE TenantId = @TenantId AND AuditEvidenceSnapshotId = @AuditEvidenceSnapshotId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        HeaderRow? row = await conn.QuerySingleOrDefaultAsync<HeaderRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AuditEvidenceSnapshotId = auditEvidenceSnapshotId },
                cancellationToken: cancellationToken));

        if (row is null)
            return null;

        IReadOnlyList<Guid> inventoryIds = await ListInventorySnapshotIdsAsync(
            conn,
            tenantId,
            auditEvidenceSnapshotId,
            cancellationToken);

        return MapHeader(row, inventoryIds);
    }

    public async Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EvidenceRowId, AuditEvidenceSnapshotId, RequirementId, TenantId, CloudResourceId,
                                  AzureResourceId, EvidenceType, CollectedUtc, CollectorVersion, NormalizedPointer,
                                  RawPointer, EvidenceHashSha256, CollectionStatus, FreshnessStatus, Confidence,
                                  Summary, ProvenanceKind, SelectorVersion, AzureScope, ApiQueryId
                           FROM dbo.AuditEvidenceSnapshotItems
                           WHERE TenantId = @TenantId AND AuditEvidenceSnapshotId = @AuditEvidenceSnapshotId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ItemRow> rows = await conn.QueryAsync<ItemRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AuditEvidenceSnapshotId = auditEvidenceSnapshotId },
                cancellationToken: cancellationToken));

        return rows.Select(MapItem).ToList();
    }

    public async Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListByAssessmentAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AuditEvidenceSnapshotId, AssessmentId, TenantId, SubscriptionIdsJson,
                                  CollectionStartedUtc, CollectionCompletedUtc, SelectorVersionsJson,
                                  FrameworkVersion, ControlCatalogVersion, Completeness, FailuresJson,
                                  WarningsJson, EvidenceHashSha256, CreatedUtc
                           FROM dbo.AuditEvidenceSnapshots
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId
                           ORDER BY CollectionCompletedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        List<HeaderRow> rows = (await conn.QueryAsync<HeaderRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId },
                cancellationToken: cancellationToken))).ToList();

        List<AuditEvidenceSnapshotHeaderRecord> headers = [];

        foreach (HeaderRow row in rows)
        {
            IReadOnlyList<Guid> inventoryIds = await ListInventorySnapshotIdsAsync(
                conn,
                tenantId,
                row.AuditEvidenceSnapshotId,
                cancellationToken);

            headers.Add(MapHeader(row, inventoryIds));
        }

        return headers;
    }

    public async Task InsertBaselineAsync(AuditEvidenceBaselineRecord baseline, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(baseline);

        const string sql = """
                           INSERT INTO dbo.AuditEvidenceBaselines
                           (BaselineId, AssessmentId, AuditEvidenceSnapshotId, TenantId, Name, DesignatedBy, DesignatedUtc)
                           VALUES (@BaselineId, @AssessmentId, @AuditEvidenceSnapshotId, @TenantId, @Name, @DesignatedBy, @DesignatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                baseline,
                cancellationToken: cancellationToken));
    }

    public async Task<AuditEvidenceBaselineRecord?> TryGetBaselineByNameAsync(
        Guid tenantId,
        Guid assessmentId,
        string baselineName,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT BaselineId, AssessmentId, AuditEvidenceSnapshotId, TenantId, Name, DesignatedBy, DesignatedUtc
                           FROM dbo.AuditEvidenceBaselines
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId AND Name = @Name;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.QuerySingleOrDefaultAsync<AuditEvidenceBaselineRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId, Name = baselineName },
                cancellationToken: cancellationToken));
    }

    private static async Task<IReadOnlyList<Guid>> ListInventorySnapshotIdsAsync(
        System.Data.IDbConnection conn,
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT AzureInventorySnapshotId
                           FROM dbo.AuditEvidenceSnapshotInventoryLinks
                           WHERE TenantId = @TenantId AND AuditEvidenceSnapshotId = @AuditEvidenceSnapshotId;
                           """;

        IEnumerable<Guid> ids = await conn.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AuditEvidenceSnapshotId = auditEvidenceSnapshotId },
                cancellationToken: cancellationToken));

        return ids.ToList();
    }

    private static AuditEvidenceSnapshotHeaderRecord MapHeader(HeaderRow row, IReadOnlyList<Guid> inventorySnapshotIds)
    {
        IReadOnlyList<string> subscriptionIds = [];
        IReadOnlyList<string> failures = [];
        IReadOnlyList<string> warnings = [];

        if (!string.IsNullOrWhiteSpace(row.SubscriptionIdsJson))
            subscriptionIds = JsonSerializer.Deserialize<List<string>>(row.SubscriptionIdsJson, JsonOptions) ?? [];

        if (!string.IsNullOrWhiteSpace(row.FailuresJson))
            failures = JsonSerializer.Deserialize<List<string>>(row.FailuresJson, JsonOptions) ?? [];

        if (!string.IsNullOrWhiteSpace(row.WarningsJson))
            warnings = JsonSerializer.Deserialize<List<string>>(row.WarningsJson, JsonOptions) ?? [];

        return new AuditEvidenceSnapshotHeaderRecord
        {
            AuditEvidenceSnapshotId = row.AuditEvidenceSnapshotId,
            AssessmentId = row.AssessmentId,
            TenantId = row.TenantId,
            SubscriptionIds = subscriptionIds,
            CollectionStartedUtc = row.CollectionStartedUtc,
            CollectionCompletedUtc = row.CollectionCompletedUtc,
            SelectorVersionsJson = row.SelectorVersionsJson,
            FrameworkVersion = row.FrameworkVersion,
            ControlCatalogVersion = row.ControlCatalogVersion,
            Completeness = row.Completeness,
            Failures = failures,
            Warnings = warnings,
            EvidenceHashSha256 = row.EvidenceHashSha256,
            InventorySnapshotIds = inventorySnapshotIds,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private static AuditEvidenceSnapshotItemRecord MapItem(ItemRow row) =>
        new()
        {
            EvidenceRowId = row.EvidenceRowId,
            AuditEvidenceSnapshotId = row.AuditEvidenceSnapshotId,
            RequirementId = row.RequirementId,
            TenantId = row.TenantId,
            CloudResourceId = row.CloudResourceId,
            AzureResourceId = row.AzureResourceId,
            EvidenceType = row.EvidenceType,
            CollectedUtc = row.CollectedUtc,
            CollectorVersion = row.CollectorVersion,
            NormalizedPointer = row.NormalizedPointer,
            RawPointer = row.RawPointer,
            EvidenceHashSha256 = row.EvidenceHashSha256,
            CollectionStatus = (AuditEvidenceCollectionStatus)row.CollectionStatus,
            FreshnessStatus = (AuditEvidenceFreshnessStatus)row.FreshnessStatus,
            Confidence = row.Confidence,
            Summary = row.Summary,
            ProvenanceKind = (ProvenanceKind)row.ProvenanceKind,
            SelectorVersion = row.SelectorVersion,
            AzureScope = row.AzureScope,
            ApiQueryId = row.ApiQueryId,
        };

    private sealed class HeaderRow
    {
        public Guid AuditEvidenceSnapshotId
        {
            get;
            init;
        }

        public Guid AssessmentId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string SubscriptionIdsJson
        {
            get;
            init;
        } = string.Empty;

        public DateTime CollectionStartedUtc
        {
            get;
            init;
        }

        public DateTime CollectionCompletedUtc
        {
            get;
            init;
        }

        public string SelectorVersionsJson
        {
            get;
            init;
        } = string.Empty;

        public string FrameworkVersion
        {
            get;
            init;
        } = string.Empty;

        public string ControlCatalogVersion
        {
            get;
            init;
        } = string.Empty;

        public decimal Completeness
        {
            get;
            init;
        }

        public string FailuresJson
        {
            get;
            init;
        } = string.Empty;

        public string WarningsJson
        {
            get;
            init;
        } = string.Empty;

        public byte[] EvidenceHashSha256
        {
            get;
            init;
        } = [];

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }

    private sealed class ItemRow
    {
        public Guid EvidenceRowId
        {
            get;
            init;
        }

        public Guid AuditEvidenceSnapshotId
        {
            get;
            init;
        }

        public Guid RequirementId
        {
            get;
            init;
        }

        public Guid TenantId
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

        public string EvidenceType
        {
            get;
            init;
        } = string.Empty;

        public DateTime CollectedUtc
        {
            get;
            init;
        }

        public string CollectorVersion
        {
            get;
            init;
        } = string.Empty;

        public string? NormalizedPointer
        {
            get;
            init;
        }

        public string? RawPointer
        {
            get;
            init;
        }

        public byte[] EvidenceHashSha256
        {
            get;
            init;
        } = [];

        public int CollectionStatus
        {
            get;
            init;
        }

        public int FreshnessStatus
        {
            get;
            init;
        }

        public decimal Confidence
        {
            get;
            init;
        }

        public string Summary
        {
            get;
            init;
        } = string.Empty;

        public int ProvenanceKind
        {
            get;
            init;
        }

        public string SelectorVersion
        {
            get;
            init;
        } = string.Empty;

        public string? AzureScope
        {
            get;
            init;
        }

        public string? ApiQueryId
        {
            get;
            init;
        }
    }
}
