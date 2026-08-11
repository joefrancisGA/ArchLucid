using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IFindingsSnapshotRepository" /> with dual-write to <c>FindingsJson</c> and relational
///     finding tables; reads prefer <c>dbo.FindingRecords</c> and fall back to <c>FindingsJson</c> when no rows exist.
///     Typed <see cref="Finding.Payload" /> is stored only in <c>FindingRecords.PayloadJson</c> (sidecar). All other
///     finding
///     fields and trace lists are relational with stable <c>SortOrder</c>. <see cref="FindingsSnapshotMigrator" /> runs on
///     save and after load so schema versioning stays consistent.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlFindingsSnapshotRepository(
    ISqlConnectionFactory writeConnectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory,
    IScopeContextProvider scopeContextProvider) : IFindingsSnapshotRepository
{
    private readonly ISqlConnectionFactory _writeConnectionFactory =
        writeConnectionFactory ?? throw new ArgumentNullException(nameof(writeConnectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (connection is not null)
        {
            await SaveCoreAsync(snapshot, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(snapshot, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = $"""
                      SELECT
                          {FindingsSnapshotReadSql.SelectHeaderColumns}
                      FROM dbo.FindingsSnapshots
                      WHERE FindingsSnapshotId = @FindingsSnapshotId
                      """ + PersistenceTenantScope.AndProjectIdTripleWhere(scope) + ";";

        DynamicParameters parameters = new();
        parameters.Add("FindingsSnapshotId", findingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
            FindingsSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<FindingsSnapshotStorageRow>(
                new CommandDefinition(
                    sql,
                    parameters,
                    cancellationToken: ct));

            if (row is null)
                return null;

            int recordCount = await SqlRelationalScalarCount.ExecuteAsync(
                connection,
                null,
                """
                SELECT COUNT(1) FROM dbo.FindingRecords
                WHERE FindingsSnapshotId = @FindingsSnapshotId
                """ + PersistenceTenantScope.AndTripleWhere(scope),
                parameters,
                ct);

            if (recordCount == 0)
            {
                if (string.IsNullOrWhiteSpace(row.FindingsJson))

                    return new FindingsSnapshot
                    {
                        FindingsSnapshotId = row.FindingsSnapshotId,
                        RunId = row.RunId,
                        ContextSnapshotId = row.ContextSnapshotId,
                        GraphSnapshotId = row.GraphSnapshotId,
                        CreatedUtc = row.CreatedUtc,
                        SchemaVersion = row.SchemaVersion,
                        GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(row.GenerationStatus),
                        Findings = []
                    };

                FindingsSnapshot fromJson = JsonEntitySerializer.Deserialize<FindingsSnapshot>(row.FindingsJson);
                fromJson.FindingsSnapshotId = row.FindingsSnapshotId;
                fromJson.RunId = row.RunId;
                fromJson.ContextSnapshotId = row.ContextSnapshotId;
                fromJson.GraphSnapshotId = row.GraphSnapshotId;
                fromJson.CreatedUtc = row.CreatedUtc;
                fromJson.SchemaVersion = row.SchemaVersion;
                CoerceNullFindingsSnapshotLists(fromJson);
                FindingsSnapshotMigrator.Apply(fromJson);
                FindingPayloadJsonCodec.HydrateJsonElementPayloads(fromJson.Findings);
                return fromJson;
            }

            FindingsSnapshot snapshot =
                await FindingsSnapshotRelationalRead.LoadRelationalSnapshotAsync(connection, row, scope, ct);
            FindingsSnapshotMetadataMerger.MergeFromFindingsJson(snapshot, row.FindingsJson);
            FindingsSnapshotMigrator.Apply(snapshot);
            return snapshot;
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetFindingsSnapshotById,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<FindingsSnapshot?> GetCoverageProjectionByIdAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string sql = $"""
                      SELECT
                          {FindingsSnapshotCoverageSql.SelectHeaderColumns}
                      FROM dbo.FindingsSnapshots
                      WHERE FindingsSnapshotId = @FindingsSnapshotId
                      """ + PersistenceTenantScope.AndProjectIdTripleWhere(scope) + ";";

        DynamicParameters parameters = new();
        parameters.Add("FindingsSnapshotId", findingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
        FindingsCoverageHeaderRow? header = await connection.QuerySingleOrDefaultAsync<FindingsCoverageHeaderRow>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));

        if (header is null)
            return null;

        string findingSql = $"""
                             SELECT
                                 {FindingsSnapshotCoverageSql.SelectFindingMetadataColumns}
                             FROM dbo.FindingRecords
                             WHERE FindingsSnapshotId = @FindingsSnapshotId
                             """ + PersistenceTenantScope.AndTripleWhere(scope) + """
                             
                             ORDER BY SortOrder ASC;
                             """;

        IReadOnlyList<FindingsCoverageFindingRow> findingRows =
            (await connection.QueryAsync<FindingsCoverageFindingRow>(
                new CommandDefinition(findingSql, parameters, cancellationToken: ct))).AsList();

        List<Finding> findings;

        if (findingRows.Count > 0)
        {
            findings = findingRows.Select(static row =>
            {
                FindingSeverity severity = Enum.TryParse(row.Severity, ignoreCase: true, out FindingSeverity parsed)
                    ? parsed
                    : FindingSeverity.Info;

                return new Finding
                {
                    FindingId = row.FindingId,
                    FindingType = row.FindingType,
                    Category = row.Category,
                    EngineType = row.EngineType,
                    Severity = severity,
                    Title = row.Title,
                    Rationale = string.Empty,
                    PolicyRuleId = string.IsNullOrWhiteSpace(row.PolicyRuleId) ? null : row.PolicyRuleId.Trim(),
                };
            }).ToList();
        }
        else
        {
            // Legacy JSON-only snapshots: hydrate once then drop payloads (relational dual-write preferred).
            FindingsSnapshot? full = await GetByIdAsync(scope, findingsSnapshotId, ct);

            if (full is null)
                return null;

            CoerceNullFindingsSnapshotLists(full);

            foreach (Finding finding in full.Findings)
                finding.Payload = null;

            return full;
        }

        List<FindingEngineFailure> engineFailures = TryDeserializeEngineFailures(header.EngineFailuresJson);

        return new FindingsSnapshot
        {
            FindingsSnapshotId = header.FindingsSnapshotId,
            RunId = header.RunId,
            ContextSnapshotId = header.ContextSnapshotId,
            GraphSnapshotId = header.GraphSnapshotId,
            CreatedUtc = header.CreatedUtc,
            SchemaVersion = header.SchemaVersion,
            GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(header.GenerationStatus),
            EngineFailures = engineFailures,
            EvaluationConfidenceEnrichmentSkipped = header.EvaluationConfidenceEnrichmentSkipped ?? false,
            Findings = findings,
        };
    }

    /// <summary>
    /// Soft-fails corrupt/partial <c>JSON_QUERY(...engineFailures)</c> so buyer-summary coverage never 500s.
    /// </summary>
    private static List<FindingEngineFailure> TryDeserializeEngineFailures(string? engineFailuresJson)
    {
        if (string.IsNullOrWhiteSpace(engineFailuresJson))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<FindingEngineFailure>>(engineFailuresJson) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    private static void CoerceNullFindingsSnapshotLists(FindingsSnapshot snapshot)
    {
        snapshot.EngineFailures ??= [];
        snapshot.Findings ??= [];
        snapshot.ChecklistCoverage ??= [];
    }

    /// <inheritdoc />
    public async Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        int? cursorSortOrder,
        Guid? cursorFindingRecordId,
        int? cursorPriorityRank,
        string? severity,
        string? category,
        string? findingType,
        int take,
        bool orderByPriority,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cursorSortOrder.HasValue ^ cursorFindingRecordId.HasValue)
            throw new ArgumentException("Cursor requires both sortOrder and findingRecordId, or neither for the first page.");

        int cappedTake = Math.Clamp(take <= 0 ? FindingPagination.DefaultTake : take, 1, FindingPagination.MaxTake);
        int fetchLimit = cappedTake + 1;

        string scopeWhere = PersistenceTenantScope.AndTripleWhere(scope);

        string sql = orderByPriority
            ? $"""
              SELECT TOP (@Limit)
                     {FindingRecordListSql.SelectMetadataColumns}
              FROM dbo.FindingRecords
              WHERE FindingsSnapshotId = @FsId{scopeWhere}
                AND (@Severity IS NULL OR Severity = @Severity)
                AND (@Category IS NULL OR Category = @Category)
                AND (@FindingType IS NULL OR FindingType = @FindingType)
                AND (
                  @HasCursor = 0
                  OR (
                    COALESCE(PriorityRank, 2147483647) > COALESCE(@CurPr, 2147483647)
                    OR (
                      COALESCE(PriorityRank, 2147483647) = COALESCE(@CurPr, 2147483647)
                      AND (
                        SortOrder > @CurSo OR (SortOrder = @CurSo AND FindingRecordId > @CurFrid)
                      )
                    )
                  )
                )
              ORDER BY COALESCE(PriorityRank, 2147483647) ASC, SortOrder ASC, FindingRecordId ASC;
              """
            : $"""
              SELECT TOP (@Limit)
                     {FindingRecordListSql.SelectMetadataColumns}
              FROM dbo.FindingRecords
              WHERE FindingsSnapshotId = @FsId{scopeWhere}
                AND (@Severity IS NULL OR Severity = @Severity)
                AND (@Category IS NULL OR Category = @Category)
                AND (@FindingType IS NULL OR FindingType = @FindingType)
                AND (
                  @HasCursor = 0
                  OR (
                    SortOrder > @CurSo OR (SortOrder = @CurSo AND FindingRecordId > @CurFrid)
                  )
                )
              ORDER BY SortOrder ASC, FindingRecordId ASC;
              """;

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);

        bool hasCursor = cursorSortOrder.HasValue && cursorFindingRecordId.HasValue;
        int cursorSort = cursorSortOrder ?? 0;

        DynamicParameters listParameters = new();
        listParameters.Add("FsId", findingsSnapshotId);
        listParameters.Add("Severity", OptionalEqualityFilter(severity));
        listParameters.Add("Category", OptionalEqualityFilter(category));
        listParameters.Add("FindingType", OptionalEqualityFilter(findingType));
        listParameters.Add("HasCursor", hasCursor ? 1 : 0);
        listParameters.Add("CurPr", cursorPriorityRank);
        listParameters.Add("CurSo", cursorSort);
        listParameters.Add("CurFrid", cursorFindingRecordId ?? Guid.Empty);
        listParameters.Add("Limit", fetchLimit);
        PersistenceTenantScope.AddScopeTripleIfNeeded(listParameters, scope);

        List<FindingMetaSqlRow> rows = (
            await connection.QueryAsync<FindingMetaSqlRow>(
                new CommandDefinition(
                    sql,
                    listParameters,
                    cancellationToken: ct))).ToList();

        bool hasMore = rows.Count > cappedTake;

        if (hasMore)

            rows.RemoveAt(rows.Count - 1);

        FindingRecordMetadataRow[] mapped =
            rows.ConvertAll(static r =>
                new FindingRecordMetadataRow(
                    r.FindingRecordId,
                    r.SortOrder,
                    r.FindingId,
                    r.FindingType,
                    r.Category,
                    r.EngineType,
                    r.Severity,
                    r.Title,
                    r.PriorityRank)).ToArray();

        return new FindingRecordMetadataPage(mapped, hasMore);
    }

    public async Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(ranks);

        if (ranks.Count == 0)
            return;

        List<(string FindingId, int PriorityRank)> normalized = ranks
            .Where(static rank => !string.IsNullOrWhiteSpace(rank.FindingId))
            .Select(static rank => (rank.FindingId.Trim(), rank.PriorityRank))
            .ToList();

        if (normalized.Count == 0)
            return;

        await using SqlConnection connection = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);

        string scopeSql = scope.TenantId == Guid.Empty
            ? string.Empty
            : " AND fr.TenantId = @ScopeTenantId AND fr.WorkspaceId = @ScopeWorkspaceId AND fr.ProjectId = @ScopeProjectId";

        const string updateHeader = """
                                    UPDATE fr
                                    SET PriorityRank = v.PriorityRank
                                    FROM dbo.FindingRecords fr
                                    INNER JOIN (VALUES
                                    """;

        const string updateFooter = """
                                    ) AS v(FindingId, PriorityRank)
                                      ON fr.FindingsSnapshotId = @FsId AND fr.FindingId = v.FindingId
                                    """;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction: null,
            normalized.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildFindingPriorityRankUpdateChunk(
                updateHeader,
                updateFooter,
                scopeSql,
                findingsSnapshotId,
                scope,
                normalized,
                offset,
                rowCount),
            ct).ConfigureAwait(false);
    }

    private static SqlChunkedBatchCommand BuildFindingPriorityRankUpdateChunk(
        string updateHeader,
        string updateFooter,
        string scopeSql,
        Guid findingsSnapshotId,
        ScopeContext scope,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        int offset,
        int rowCount)
    {
        StringBuilder commandText = new(updateHeader.Length + updateFooter.Length + scopeSql.Length + rowCount * 48);
        commandText.Append(updateHeader);
        DynamicParameters parameters = new();
        parameters.Add("FsId", findingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);

        for (int i = 0; i < rowCount; i++)
        {
            (string findingId, int priorityRank) = ranks[offset + i];

            if (i > 0)
                commandText.Append(',');

            commandText.Append($"(@FindingId{i},@PriorityRank{i})");
            parameters.Add($"FindingId{i}", findingId);
            parameters.Add($"PriorityRank{i}", priorityRank);
        }

        commandText.Append(updateFooter);
        commandText.Append(scopeSql);
        commandText.Append(';');
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }

    private sealed class FindingsCoverageHeaderRow
    {
        public Guid FindingsSnapshotId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public Guid ContextSnapshotId
        {
            get;
            init;
        }

        public Guid GraphSnapshotId
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public int SchemaVersion
        {
            get;
            init;
        }

        public string? GenerationStatus
        {
            get;
            init;
        }

        public string? EngineFailuresJson
        {
            get;
            init;
        }

        public bool? EvaluationConfidenceEnrichmentSkipped
        {
            get;
            init;
        }
    }

    private sealed class FindingsCoverageFindingRow
    {
        public string FindingId
        {
            get;
            init;
        } = null!;

        public string FindingType
        {
            get;
            init;
        } = null!;

        public string Category
        {
            get;
            init;
        } = null!;

        public string EngineType
        {
            get;
            init;
        } = null!;

        public string Severity
        {
            get;
            init;
        } = null!;

        public string Title
        {
            get;
            init;
        } = null!;

        public string? PolicyRuleId
        {
            get;
            init;
        }
    }

    private sealed class FindingMetaSqlRow
    {
        public Guid FindingRecordId
        {
            get;
            init;
        }

        public int SortOrder
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = null!;

        public string FindingType
        {
            get;
            init;
        } = null!;

        public string Category
        {
            get;
            init;
        } = null!;

        public string EngineType
        {
            get;
            init;
        } = null!;

        public string Severity
        {
            get;
            init;
        } = null!;

        public string Title
        {
            get;
            init;
        } = null!;

        public int? PriorityRank
        {
            get;
            init;
        }
    }

    private async Task SaveCoreAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        FindingsSnapshotMigrator.Apply(snapshot);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        const string headerSql = """
                                 INSERT INTO dbo.FindingsSnapshots
                                 (
                                     FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId,
                                     TenantId, WorkspaceId, ProjectId,
                                     CreatedUtc, SchemaVersion, GenerationStatus, FindingsJson,
                                     ChecklistCoverageJson, InsightDensityDemotedCount, InsightDensityRetainedCount
                                 )
                                 VALUES
                                 (
                                     @FindingsSnapshotId, @RunId, @ContextSnapshotId, @GraphSnapshotId,
                                     @TenantId, @WorkspaceId, @ProjectId,
                                     @CreatedUtc, @SchemaVersion, @GenerationStatus, @FindingsJson,
                                     @ChecklistCoverageJson, @InsightDensityDemotedCount, @InsightDensityRetainedCount
                                 );
                                 """;

        object headerArgs = new
        {
            snapshot.FindingsSnapshotId,
            snapshot.RunId,
            snapshot.ContextSnapshotId,
            snapshot.GraphSnapshotId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshot.CreatedUtc,
            snapshot.SchemaVersion,
            GenerationStatus = snapshot.GenerationStatus.ToString(),
            FindingsJson = JsonEntitySerializer.Serialize(snapshot),
            ChecklistCoverageJson = ChecklistCoverageJsonCodec.Serialize(snapshot.ChecklistCoverage),
            InsightDensityDemotedCount = snapshot.InsightDensityCuration?.DemotedToChecklistCount,
            InsightDensityRetainedCount = snapshot.InsightDensityCuration?.RetainedFindingCount,
        };

        await connection.ExecuteAsync(new CommandDefinition(headerSql, headerArgs, transaction, cancellationToken: ct))
            ;

        await InsertFindingsRelationalFromSnapshotAsync(
            snapshot,
            connection,
            transaction,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    internal static async Task InsertFindingsRelationalFromSnapshotAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        for (int i = 0; i < snapshot.Findings.Count; i++)
        {
            Finding finding = snapshot.Findings[i];
            Guid recordId = Guid.NewGuid();

            await InsertFindingRecordAsync(
                connection,
                transaction,
                snapshot.FindingsSnapshotId,
                recordId,
                i,
                finding,
                tenantId,
                workspaceId,
                projectId,
                ct);

            await InsertFindingChildrenAsync(
                connection,
                transaction,
                recordId,
                finding,
                tenantId,
                workspaceId,
                projectId,
                ct);
        }
    }

    private static async Task InsertFindingRecordAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingsSnapshotId,
        Guid findingRecordId,
        int sortOrder,
        Finding finding,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO dbo.FindingRecords
                           (
                               FindingRecordId, FindingsSnapshotId, SortOrder,
                               TenantId, WorkspaceId, ProjectId,
                               FindingId, FindingSchemaVersion, FindingType, Category, EngineType,
                               Severity, Title, Rationale, PayloadType, PayloadJson,
                               RequestInputRef, RunIdRef, AgentExecutionTraceId,
                               ModelDeploymentName, ModelVersion, PromptTemplateId, PromptTemplateVersion,
                               ConfidenceScore, EvaluationConfidenceScore, EvaluationConfidenceLevel, PolicyRuleId,
                               HumanReviewStatus, ReviewedByUserId, ReviewedAtUtc, ReviewNotes,
                               IsMuted, MuteReason, ReasoningTrace, ReasoningTraceDigestSha256,
                               InsightDensityScore, Treatment, Classification,
                               WhyThisIsNotGeneric, PrincipalArchitectValue, DecisionConsequence
                           )
                           VALUES
                           (
                               @FindingRecordId, @FindingsSnapshotId, @SortOrder,
                               @TenantId, @WorkspaceId, @ProjectId,
                               @FindingId, @FindingSchemaVersion, @FindingType, @Category, @EngineType,
                               @Severity, @Title, @Rationale, @PayloadType, @PayloadJson,
                               @RequestInputRef, @RunIdRef, @AgentExecutionTraceId,
                               @ModelDeploymentName, @ModelVersion, @PromptTemplateId, @PromptTemplateVersion,
                               @ConfidenceScore, @EvaluationConfidenceScore, @EvaluationConfidenceLevel, @PolicyRuleId,
                               @HumanReviewStatus, @ReviewedByUserId, @ReviewedAtUtc, @ReviewNotes,
                               @IsMuted, @MuteReason, @ReasoningTrace, @ReasoningTraceDigestSha256,
                               @InsightDensityScore, @Treatment, @Classification,
                               @WhyThisIsNotGeneric, @PrincipalArchitectValue, @DecisionConsequence
                           );
                           """;

        object args = new
        {
            FindingRecordId = findingRecordId,
            FindingsSnapshotId = findingsSnapshotId,
            SortOrder = sortOrder,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            finding.FindingId,
            finding.FindingSchemaVersion,
            finding.FindingType,
            finding.Category,
            finding.EngineType,
            Severity = finding.Severity.ToString(),
            finding.Title,
            finding.Rationale,
            finding.PayloadType,
            PayloadJson = FindingPayloadJsonCodec.SerializePayload(finding.Payload),
            finding.RequestInputRef,
            finding.RunIdRef,
            AgentExecutionTraceId = finding.AgentExecutionTraceId ?? finding.Trace.SourceAgentExecutionTraceId,
            finding.ModelDeploymentName,
            finding.ModelVersion,
            finding.PromptTemplateId,
            finding.PromptTemplateVersion,
            finding.ConfidenceScore,
            finding.EvaluationConfidenceScore,
            EvaluationConfidenceLevel = finding.ConfidenceLevel is { } lvl ? lvl.ToString() : null,
            finding.PolicyRuleId,
            HumanReviewStatus = finding.HumanReviewStatus.ToString(),
            finding.ReviewedByUserId,
            finding.ReviewedAtUtc,
            finding.ReviewNotes,
            finding.IsMuted,
            finding.MuteReason,
            ReasoningTrace = finding.Trace.ReasoningTrace,
            ReasoningTraceDigestSha256 = finding.Trace.ReasoningTraceDigestSha256,
            finding.InsightDensityScore,
            Treatment = FindingInsightDensityColumnCodec.ToTreatmentStorage(finding.Treatment),
            Classification = FindingInsightDensityColumnCodec.ToClassificationStorage(finding.Classification),
            finding.WhyThisIsNotGeneric,
            finding.PrincipalArchitectValue,
            finding.DecisionConsequence
        };

        await connection.ExecuteAsync(new CommandDefinition(sql, args, transaction, cancellationToken: ct));
    }

    private static async Task InsertFindingChildrenAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Finding finding,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        await InsertFindingChildSortNodeIdRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.RelatedNodesInsert,
            finding.RelatedNodeIds,
            ct);

        await InsertFindingChildSortTextRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.RecommendedActionsInsert,
            finding.RecommendedActions,
            ct);

        List<KeyValuePair<string, string>> orderedProps = finding.Properties
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .ToList();

        await InsertFindingChildPropertyRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            orderedProps,
            ct);

        await InsertFindingChildSortNodeIdRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.TraceGraphNodesExaminedInsert,
            finding.Trace.GraphNodeIdsExamined,
            ct);

        await InsertFindingChildSortTextRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.TraceRulesAppliedInsert,
            finding.Trace.RulesApplied,
            ct);

        await InsertFindingChildSortTextRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.TraceDecisionsTakenInsert,
            finding.Trace.DecisionsTaken,
            ct);

        await InsertFindingChildSortTextRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.TraceAlternativePathsInsert,
            finding.Trace.AlternativePathsConsidered,
            ct);

        await InsertFindingChildSortTextRowsIfAnyAsync(
            connection,
            transaction,
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            FindingChildInsertQueryShapes.TraceNotesInsert,
            finding.Trace.Notes,
            ct);
    }

    private static async Task InsertFindingChildSortNodeIdRowsIfAnyAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string sql,
        IReadOnlyList<string> nodeIds,
        CancellationToken ct)
    {
        if (nodeIds.Count == 0)
        {
            return;
        }

        DataTable rows = FindingChildTableValuedParameters.CreateSortNodeIdTable(nodeIds);
        DynamicParameters parameters = FindingChildTableValuedParameters.CreateScopeParameters(
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            rows,
            FindingChildTableValuedParameters.SortNodeIdListTypeName);

        await connection.ExecuteAsync(new CommandDefinition(sql, parameters, transaction, cancellationToken: ct));
    }

    private static async Task InsertFindingChildSortTextRowsIfAnyAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string sql,
        IReadOnlyList<string> textRows,
        CancellationToken ct)
    {
        if (textRows.Count == 0)
        {
            return;
        }

        DataTable rows = FindingChildTableValuedParameters.CreateSortTextTable(textRows);
        DynamicParameters parameters = FindingChildTableValuedParameters.CreateScopeParameters(
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            rows,
            FindingChildTableValuedParameters.SortTextListTypeName);

        await connection.ExecuteAsync(new CommandDefinition(sql, parameters, transaction, cancellationToken: ct));
    }

    private static async Task InsertFindingChildPropertyRowsIfAnyAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid findingRecordId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<KeyValuePair<string, string>> orderedProps,
        CancellationToken ct)
    {
        if (orderedProps.Count == 0)
        {
            return;
        }

        DataTable rows = FindingChildTableValuedParameters.CreatePropertyTable(orderedProps);
        DynamicParameters parameters = FindingChildTableValuedParameters.CreateScopeParameters(
            findingRecordId,
            tenantId,
            workspaceId,
            projectId,
            rows,
            FindingChildTableValuedParameters.PropertyListTypeName);

        await connection.ExecuteAsync(
            new CommandDefinition(
                FindingChildInsertQueryShapes.PropertiesInsert,
                parameters,
                transaction,
                cancellationToken: ct));
    }

    /// <summary>
    ///     Inserts relational finding rows when <c>FindingRecords</c> is still empty (idempotent).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        int recordCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.FindingRecords WHERE FindingsSnapshotId = @FindingsSnapshotId",
            new { snapshot.FindingsSnapshotId },
            ct);

        if (recordCount > 0 || snapshot.Findings.Count == 0)
            return;

        FindingsSnapshotMigrator.Apply(snapshot);

        const string scopeSql = """
                                SELECT TenantId, WorkspaceId, ProjectId
                                FROM dbo.FindingsSnapshots
                                WHERE FindingsSnapshotId = @FindingsSnapshotId;
                                """;

        FindingSnapshotScopeRow? scopeHdr = await connection.QuerySingleOrDefaultAsync<FindingSnapshotScopeRow>(
            new CommandDefinition(scopeSql, new { snapshot.FindingsSnapshotId }, transaction, cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ProjectId is null)
            throw new InvalidOperationException(
                $"dbo.FindingsSnapshots row {snapshot.FindingsSnapshotId} lacks denormalized RLS scope (tenant/workspace/project); cannot backfill FindingRecords.");

        await InsertFindingsRelationalFromSnapshotAsync(
            snapshot,
            connection,
            transaction,
            scopeHdr.TenantId!.Value,
            scopeHdr.WorkspaceId!.Value,
            scopeHdr.ProjectId!.Value,
            ct);
    }

    private sealed record FindingSnapshotScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ProjectId);

    private static string? OptionalEqualityFilter(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
