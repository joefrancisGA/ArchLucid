using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IGoldenManifestRepository" /> with dual-write to legacy JSON columns and
///     phase-1 relational tables for assumptions, warnings, decisions (+ evidence/node links + RawDecisionJson),
///     and provenance reference lists. Reads prefer relational slices per collection when rows exist.
///     JSON columns are <c>NVARCHAR(MAX)</c> with rowstore PAGE compression (migration 174); payloads above
///     <see cref="ArtifactLargePayloadOptions" /> thresholds offload to <c>ManifestPayloadBlobUri</c> instead of growing in-row JSON.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlGoldenManifestRepository(
    ISqlConnectionFactory connectionFactory,
    IGoldenManifestLookupReadConnectionFactory manifestLookupReadConnectionFactory,
    IArtifactBlobStore blobStore,
    IOptionsMonitor<ArtifactLargePayloadOptions> largePayloadOptions) : IGoldenManifestRepository
{
    public async Task SaveAsync(
        ManifestDocument manifest,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ScopedRepositoryScopeValidation.RequireEntityTenant(manifest.TenantId);

        if (connection is not null)
        {
            await SaveCoreAsync(manifest, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(manifest, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<ManifestDocument> SaveAsync(
        Cm.GoldenManifest contract,
        ScopeContext scope,
        SaveContractsManifestOptions keying,
        IManifestHashService contractHash,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null,
        ManifestDocument? authorityPersistBody = null)
    {
        if (contract is null)
            throw new ArgumentNullException(nameof(contract));
        if (scope is null)
            throw new ArgumentNullException(nameof(scope));
        if (keying is null)
            throw new ArgumentNullException(nameof(keying));
        if (contractHash is null)
            throw new ArgumentNullException(nameof(contractHash));
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);
        ManifestDocument model = ContractGoldenManifestPersistence.ResolveGoldenManifestForContractSave(
            contract,
            scope,
            keying,
            authorityPersistBody);
        model.ManifestHash = contractHash.ComputeHash(model);
        await SaveAsync(model, ct, connection, transaction);
        return model;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        if (connection is not null)
            return await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, connection, transaction, cancellationToken);

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            IReadOnlyList<Guid> superseded =
                await SupersedeUnreferencedActiveGoldenManifestsCoreAsync(scope, newManifestId, owned, tx, cancellationToken);
            tx.Commit();
            return superseded;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static async Task<IReadOnlyList<Guid>> SupersedeUnreferencedActiveGoldenManifestsCoreAsync(
        ScopeContext scope,
        Guid newManifestId,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE gm
                           SET LifecycleStatus = @SupersededStatus
                           OUTPUT deleted.ManifestId
                           FROM dbo.GoldenManifests AS gm
                           WHERE gm.TenantId = @TenantId
                             AND gm.WorkspaceId = @WorkspaceId
                             AND gm.ProjectId = @ProjectId
                             AND gm.LifecycleStatus = @ActiveStatus
                             AND gm.ArchivedUtc IS NULL
                             AND gm.ManifestId <> @NewManifestId
                             AND NOT EXISTS (
                                 SELECT 1
                                 FROM dbo.Runs AS r
                                 WHERE r.GoldenManifestId = gm.ManifestId
                                   AND r.TenantId = @TenantId
                                   AND r.WorkspaceId = @WorkspaceId
                                   AND r.ScopeProjectId = @ProjectId
                                   AND r.ArchivedUtc IS NULL);
                           """;

        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    NewManifestId = newManifestId,
                    ActiveStatus = nameof(GoldenManifestLifecycleStatus.Active),
                    SupersededStatus = nameof(GoldenManifestLifecycleStatus.Superseded)
                },
                transaction,
                cancellationToken: cancellationToken));

        return rows.AsList();
    }

    public async Task<ManifestDocument?> GetByIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        const string sql = """
                           SELECT
                               TenantId, WorkspaceId, ProjectId,
                               ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                               CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                               MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                               ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                               WarningsJson, ProvenanceJson, ManifestPayloadBlobUri
                           FROM dbo.GoldenManifests
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND ManifestId = @ManifestId;
                           """;

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection =
                await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(ct);
            GoldenManifestStorageRow? row = await connection.QuerySingleOrDefaultAsync<GoldenManifestStorageRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        ManifestId = manifestId
                    },
                    flags: CommandFlags.None,
                    cancellationToken: ct));

            if (row is null)
                return null;

            row = await ApplyManifestBlobOverlayIfPresentAsync(row, ct);

            return await GoldenManifestPhase1RelationalRead.HydrateAsync(connection, row, ct);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetGoldenManifestById,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<ManifestDocument?> GetByContractManifestVersionAsync(
        ScopeContext scope,
        string manifestVersion,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(manifestVersion))
            throw new ArgumentException("Manifest version is required.", nameof(manifestVersion));

        const string sql = """
                           SELECT TOP (1)
                               TenantId, WorkspaceId, ProjectId,
                               ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                               CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                               MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                               ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                               WarningsJson, ProvenanceJson, ManifestPayloadBlobUri
                           FROM dbo.GoldenManifests
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND JSON_VALUE(MetadataJson, '$.Version') = @ManifestVersion
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(ct);
        GoldenManifestStorageRow? row = await connection.QuerySingleOrDefaultAsync<GoldenManifestStorageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    ManifestVersion = manifestVersion
                },
                cancellationToken: ct));

        if (row is null)
            return null;

        row = await ApplyManifestBlobOverlayIfPresentAsync(row, ct);

        return await GoldenManifestPhase1RelationalRead.HydrateAsync(connection, row, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ManifestDocument>> ListPriorCommittedForRetrievalAsync(
        ScopeContext scope,
        Guid excludeRunId,
        int maxManifests,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (maxManifests <= 0)
            return Array.Empty<ManifestDocument>();

        const string sql = """
                           SELECT TOP (@MaxManifests)
                               TenantId, WorkspaceId, ProjectId,
                               ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                               CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                               MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                               ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                               WarningsJson, ProvenanceJson, ManifestPayloadBlobUri
                           FROM dbo.GoldenManifests WITH (NOLOCK)
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND RunId <> @ExcludeRunId
                             AND (ArchivedUtc IS NULL)
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection =
            await manifestLookupReadConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<GoldenManifestStorageRow> rows = await connection.QueryAsync<GoldenManifestStorageRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    ExcludeRunId = excludeRunId,
                    MaxManifests = maxManifests,
                },
                cancellationToken: cancellationToken));

        List<ManifestDocument> documents = [];

        foreach (GoldenManifestStorageRow row in rows)
        {
            GoldenManifestStorageRow hydratedRow = await ApplyManifestBlobOverlayIfPresentAsync(row, cancellationToken);
            ManifestDocument? document =
                await GoldenManifestPhase1RelationalRead.HydrateAsync(connection, hydratedRow, cancellationToken);

            if (document is not null)
                documents.Add(document);
        }

        return documents;
    }

    private async Task SaveCoreAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO dbo.GoldenManifests
                           (
                               TenantId, WorkspaceId, ProjectId,
                               ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                               CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                               MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                               ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                               WarningsJson, ProvenanceJson, ManifestPayloadBlobUri, LifecycleStatus
                           )
                           VALUES
                           (
                               @TenantId, @WorkspaceId, @ProjectId,
                               @ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                               @CreatedUtc, @ManifestHash, @RuleSetId, @RuleSetVersion, @RuleSetHash,
                               @MetadataJson, @RequirementsJson, @TopologyJson, @SecurityJson, @ComplianceJson, @CostJson,
                               @ConstraintsJson, @UnresolvedIssuesJson, @DecisionsJson, @AssumptionsJson,
                               @WarningsJson, @ProvenanceJson, @ManifestPayloadBlobUri, @LifecycleStatus
                           );
                           """;

        string metadataJson = JsonEntitySerializer.Serialize(manifest.Metadata);
        string requirementsJson = JsonEntitySerializer.Serialize(manifest.Requirements);
        string topologyJson = JsonEntitySerializer.Serialize(manifest.Topology);
        string securityJson = JsonEntitySerializer.Serialize(manifest.Security);
        string complianceJson = JsonEntitySerializer.Serialize(manifest.Compliance);
        string costJson = JsonEntitySerializer.Serialize(manifest.Cost);
        string constraintsJson = JsonEntitySerializer.Serialize(manifest.Constraints);
        string unresolvedIssuesJson = JsonEntitySerializer.Serialize(manifest.UnresolvedIssues);
        string decisionsJson = JsonEntitySerializer.Serialize(manifest.Decisions);
        string assumptionsJson = JsonEntitySerializer.Serialize(manifest.Assumptions);
        string warningsJson = JsonEntitySerializer.Serialize(manifest.Warnings);
        string provenanceJson = JsonEntitySerializer.Serialize(manifest.Provenance);

        int totalLen = GoldenManifestPayloadBlobEnvelope.SumUtf16Length(
            metadataJson,
            requirementsJson,
            topologyJson,
            securityJson,
            complianceJson,
            costJson,
            constraintsJson,
            unresolvedIssuesJson,
            decisionsJson,
            assumptionsJson,
            warningsJson,
            provenanceJson);

        ArtifactLargePayloadOptions payloadOpts = largePayloadOptions.CurrentValue;
        string? manifestBlobUri = null;

        if (LargePayloadOffloadEvaluator.ShouldOffloadManifestOrBundle(payloadOpts, totalLen))
        {
            GoldenManifestPayloadBlobEnvelope envelope = GoldenManifestPayloadBlobEnvelope.FromSerializedSlices(
                metadataJson,
                requirementsJson,
                topologyJson,
                securityJson,
                complianceJson,
                costJson,
                constraintsJson,
                unresolvedIssuesJson,
                decisionsJson,
                assumptionsJson,
                warningsJson,
                provenanceJson);
            manifestBlobUri = await blobStore.WriteAsync(
                "golden-manifests",
                $"{manifest.ManifestId:D}.json",
                envelope.ToJson(),
                ct);
        }

        object args = new
        {
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId,
            manifest.ManifestId,
            manifest.RunId,
            manifest.ContextSnapshotId,
            manifest.GraphSnapshotId,
            manifest.FindingsSnapshotId,
            manifest.DecisionTraceId,
            manifest.CreatedUtc,
            manifest.ManifestHash,
            manifest.RuleSetId,
            manifest.RuleSetVersion,
            manifest.RuleSetHash,
            MetadataJson = metadataJson,
            RequirementsJson = requirementsJson,
            TopologyJson = topologyJson,
            SecurityJson = securityJson,
            ComplianceJson = complianceJson,
            CostJson = costJson,
            ConstraintsJson = constraintsJson,
            UnresolvedIssuesJson = unresolvedIssuesJson,
            DecisionsJson = decisionsJson,
            AssumptionsJson = assumptionsJson,
            WarningsJson = warningsJson,
            ProvenanceJson = provenanceJson,
            ManifestPayloadBlobUri = manifestBlobUri,
            LifecycleStatus = nameof(GoldenManifestLifecycleStatus.Active)
        };

        await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct));

        await InsertRelationalPhase1Async(manifest, connection, transaction, ct);
    }

    private static async Task InsertRelationalPhase1Async(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        await InsertGoldenManifestAssumptionsRelationalAsync(manifest, connection, transaction, ct);
        await InsertGoldenManifestWarningsRelationalAsync(manifest, connection, transaction, ct);
        await InsertGoldenManifestProvSourceFindingsRelationalAsync(manifest, connection, transaction, ct);
        await InsertGoldenManifestProvSourceGraphNodesRelationalAsync(manifest, connection, transaction, ct);
        await InsertGoldenManifestProvAppliedRulesRelationalAsync(manifest, connection, transaction, ct);
        await InsertGoldenManifestDecisionsRelationalAsync(manifest, connection, transaction, ct);
    }

    private static async Task InsertGoldenManifestAssumptionsRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;

        const string insertAssumptionSql = """
                                           INSERT INTO dbo.GoldenManifestAssumptions (
                                               ManifestId, SortOrder, AssumptionText,
                                               TenantId, WorkspaceId, ProjectId)
                                           VALUES (
                                               @ManifestId, @SortOrder, @AssumptionText,
                                               @TenantId, @WorkspaceId, @ProjectId);
                                           """;

        for (int i = 0; i < manifest.Assumptions.Count; i++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertAssumptionSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = i,
                        AssumptionText = manifest.Assumptions[i],
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertGoldenManifestWarningsRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;

        const string insertWarningSql = """
                                        INSERT INTO dbo.GoldenManifestWarnings (
                                            ManifestId, SortOrder, WarningText,
                                            TenantId, WorkspaceId, ProjectId)
                                        VALUES (@ManifestId, @SortOrder, @WarningText, @TenantId, @WorkspaceId, @ProjectId);
                                        """;

        for (int w = 0; w < manifest.Warnings.Count; w++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertWarningSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = w,
                        WarningText = manifest.Warnings[w],
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertGoldenManifestProvSourceFindingsRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;
        List<string> provFindingIds = manifest.Provenance.SourceFindingIds;

        const string insertProvFindingSql = """
                                            INSERT INTO dbo.GoldenManifestProvenanceSourceFindings (
                                                ManifestId, SortOrder, FindingId,
                                                TenantId, WorkspaceId, ProjectId)
                                            VALUES (@ManifestId, @SortOrder, @FindingId, @TenantId, @WorkspaceId, @ProjectId);
                                            """;

        for (int p = 0; p < provFindingIds.Count; p++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertProvFindingSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = p,
                        FindingId = provFindingIds[p],
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertGoldenManifestProvSourceGraphNodesRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;
        List<string> provNodeIds = manifest.Provenance.SourceGraphNodeIds;

        const string insertProvNodeSql = """
                                         INSERT INTO dbo.GoldenManifestProvenanceSourceGraphNodes (
                                             ManifestId, SortOrder, NodeId,
                                             TenantId, WorkspaceId, ProjectId)
                                         VALUES (@ManifestId, @SortOrder, @NodeId, @TenantId, @WorkspaceId, @ProjectId);
                                         """;

        for (int p = 0; p < provNodeIds.Count; p++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertProvNodeSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = p,
                        NodeId = provNodeIds[p],
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertGoldenManifestProvAppliedRulesRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;
        List<string> provRuleIds = manifest.Provenance.AppliedRuleIds;

        const string insertProvRuleSql = """
                                         INSERT INTO dbo.GoldenManifestProvenanceAppliedRules (
                                             ManifestId, SortOrder, RuleId,
                                             TenantId, WorkspaceId, ProjectId)
                                         VALUES (@ManifestId, @SortOrder, @RuleId, @TenantId, @WorkspaceId, @ProjectId);
                                         """;

        for (int p = 0; p < provRuleIds.Count; p++)

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertProvRuleSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = p,
                        RuleId = provRuleIds[p],
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));
    }

    private static async Task InsertGoldenManifestDecisionsRelationalAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        Guid manifestId = manifest.ManifestId;

        const string insertDecisionSql = """
                                         INSERT INTO dbo.GoldenManifestDecisions
                                         (
                                             ManifestId, SortOrder, DecisionId, Category, Title, SelectedOption, Rationale, RawDecisionJson,
                                             Confidence, ConfidenceSource,
                                             TenantId, WorkspaceId, ProjectId
                                         )
                                         VALUES
                                         (
                                             @ManifestId, @SortOrder, @DecisionId, @Category, @Title, @SelectedOption, @Rationale, @RawDecisionJson,
                                             @Confidence, @ConfidenceSource,
                                             @TenantId, @WorkspaceId, @ProjectId
                                         );
                                         """;

        const string insertEvidenceSql = """
                                         INSERT INTO dbo.GoldenManifestDecisionEvidenceLinks (
                                             ManifestId, DecisionId, SortOrder, FindingId,
                                             TenantId, WorkspaceId, ProjectId)
                                         VALUES (@ManifestId, @DecisionId, @SortOrder, @FindingId, @TenantId, @WorkspaceId, @ProjectId);
                                         """;

        const string insertNodeLinkSql = """
                                         INSERT INTO dbo.GoldenManifestDecisionNodeLinks (
                                             ManifestId, DecisionId, SortOrder, NodeId,
                                             TenantId, WorkspaceId, ProjectId)
                                         VALUES (@ManifestId, @DecisionId, @SortOrder, @NodeId, @TenantId, @WorkspaceId, @ProjectId);
                                         """;

        for (int d = 0; d < manifest.Decisions.Count; d++)
        {
            ResolvedArchitectureDecision decision = manifest.Decisions[d];

            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertDecisionSql,
                    new
                    {
                        ManifestId = manifestId,
                        SortOrder = d,
                        decision.DecisionId,
                        decision.Category,
                        decision.Title,
                        decision.SelectedOption,
                        decision.Rationale,
                        decision.RawDecisionJson,
                        decision.Confidence,
                        ConfidenceSource = decision.ConfidenceSource.ToString(),
                        manifest.TenantId,
                        manifest.WorkspaceId,
                        manifest.ProjectId
                    },
                    transaction,
                    cancellationToken: ct));

            for (int e = 0; e < decision.SupportingFindingIds.Count; e++)

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertEvidenceSql,
                        new
                        {
                            ManifestId = manifestId,
                            decision.DecisionId,
                            SortOrder = e,
                            FindingId = decision.SupportingFindingIds[e],
                            manifest.TenantId,
                            manifest.WorkspaceId,
                            manifest.ProjectId
                        },
                        transaction,
                        cancellationToken: ct));

            for (int n = 0; n < decision.RelatedNodeIds.Count; n++)

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertNodeLinkSql,
                        new
                        {
                            ManifestId = manifestId,
                            decision.DecisionId,
                            SortOrder = n,
                            NodeId = decision.RelatedNodeIds[n],
                            manifest.TenantId,
                            manifest.WorkspaceId,
                            manifest.ProjectId
                        },
                        transaction,
                        cancellationToken: ct));
        }
    }

    private async Task<GoldenManifestStorageRow> ApplyManifestBlobOverlayIfPresentAsync(
        GoldenManifestStorageRow row,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(row.ManifestPayloadBlobUri))
            return row;

        string? json = await blobStore.ReadAsync(row.ManifestPayloadBlobUri!, ct);

        if (string.IsNullOrEmpty(json))
            return row;

        GoldenManifestPayloadBlobEnvelope? envelope = GoldenManifestPayloadBlobEnvelope.TryDeserialize(json);

        if (envelope is null || envelope.SchemaVersion != GoldenManifestPayloadBlobEnvelope.CurrentSchemaVersion)
            return row;

        return GoldenManifestPayloadBlobEnvelope.MergeIntoRow(row, envelope);
    }

    /// <summary>
    ///     Inserts phase-1 relational slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    internal static async Task BackfillPhase1RelationalSlicesAsync(
        ManifestDocument manifest,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(connection);

        Guid manifestId = manifest.ManifestId;
        ScopedRepositoryScopeValidation.RequireEntityTenant(manifest.TenantId);

        object sliceCountArgs = new
        {
            ManifestId = manifestId,
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId
        };

        const string sliceTenantWhere =
            "ManifestId = @ManifestId AND TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId";

        int assumptionsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestAssumptions WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        int warningsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestWarnings WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        int provFindingCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceFindings WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        int provNodeCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceGraphNodes WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        int provRuleCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceAppliedRules WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        int decisionsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            $"SELECT COUNT(1) FROM dbo.GoldenManifestDecisions WHERE {sliceTenantWhere}",
            sliceCountArgs,
            ct);

        if (assumptionsCount == 0 && manifest.Assumptions.Count > 0)
            await InsertGoldenManifestAssumptionsRelationalAsync(manifest, connection, transaction, ct);

        if (warningsCount == 0 && manifest.Warnings.Count > 0)
            await InsertGoldenManifestWarningsRelationalAsync(manifest, connection, transaction, ct);

        if (provFindingCount == 0 && manifest.Provenance.SourceFindingIds.Count > 0)
            await InsertGoldenManifestProvSourceFindingsRelationalAsync(manifest, connection, transaction, ct);

        if (provNodeCount == 0 && manifest.Provenance.SourceGraphNodeIds.Count > 0)
            await InsertGoldenManifestProvSourceGraphNodesRelationalAsync(manifest, connection, transaction, ct);

        if (provRuleCount == 0 && manifest.Provenance.AppliedRuleIds.Count > 0)
            await InsertGoldenManifestProvAppliedRulesRelationalAsync(manifest, connection, transaction, ct);

        if (decisionsCount == 0 && manifest.Decisions.Count > 0)
            await InsertGoldenManifestDecisionsRelationalAsync(manifest, connection, transaction, ct);
    }
}
