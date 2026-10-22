using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent; covered via integration/architecture tests.")]
public sealed class DapperFindingSemanticSupportBandOverlayRepository(ISqlConnectionFactory connectionFactory)
    : IFindingSemanticSupportBandOverlayRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task UpsertAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        FindingSemanticSupportBandOverlayRecord overlay,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(overlay);
        ArgumentException.ThrowIfNullOrWhiteSpace(overlay.FindingId);
        ArgumentException.ThrowIfNullOrWhiteSpace(overlay.ScorerVersion);

        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;

        const string sql = """
                           MERGE dbo.FindingSemanticSupportBandOverlays AS target
                           USING (
                               SELECT @FindingsSnapshotId AS FindingsSnapshotId,
                                      @FindingId AS FindingId
                           ) AS source
                           ON target.FindingsSnapshotId = source.FindingsSnapshotId
                              AND target.FindingId = source.FindingId
                           WHEN MATCHED AND target.FrozenAtUtc IS NULL THEN
                               UPDATE SET SemanticSupportBand = @SemanticSupportBand,
                                          ScorerVersion = @ScorerVersion,
                                          EvidenceExcerptHashSha256 = @EvidenceExcerptHashSha256,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (
                                   FindingsSnapshotId,
                                   FindingId,
                                   TenantId,
                                   WorkspaceId,
                                   ProjectId,
                                   SemanticSupportBand,
                                   ScorerVersion,
                                   EvidenceExcerptHashSha256,
                                   ScoredAtUtc,
                                   UpdatedUtc)
                               VALUES (
                                   @FindingsSnapshotId,
                                   @FindingId,
                                   @TenantId,
                                   @WorkspaceId,
                                   @ProjectId,
                                   @SemanticSupportBand,
                                   @ScorerVersion,
                                   @EvidenceExcerptHashSha256,
                                   @ScoredAtUtc,
                                   @UpdatedUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    FindingsSnapshotId = findingsSnapshotId,
                    FindingId = overlay.FindingId.Trim(),
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SemanticSupportBand = overlay.Band.ToString(),
                    overlay.ScorerVersion,
                    overlay.EvidenceExcerptHashSha256,
                    ScoredAtUtc = overlay.ScoredAtUtc == default ? utcNow : overlay.ScoredAtUtc,
                    UpdatedUtc = utcNow,
                },
                cancellationToken: cancellationToken));

        if (rows == 0)
        {
            throw new InvalidOperationException(
                $"Semantic support band overlay for finding '{overlay.FindingId}' is frozen or could not be upserted.");
        }
    }

    public async Task<IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord>> GetBySnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT FindingId,
                                  SemanticSupportBand,
                                  ScorerVersion,
                                  EvidenceExcerptHashSha256,
                                  ScoredAtUtc,
                                  UpdatedUtc,
                                  FrozenAtUtc
                           FROM dbo.FindingSemanticSupportBandOverlays
                           WHERE FindingsSnapshotId = @FindingsSnapshotId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        List<Row> rows = (
            await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        FindingsSnapshotId = findingsSnapshotId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                    },
                    cancellationToken: cancellationToken))).ToList();

        Dictionary<string, FindingSemanticSupportBandOverlayRecord> map = new(StringComparer.Ordinal);

        foreach (Row row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.FindingId))
                continue;

            if (!Enum.TryParse(row.SemanticSupportBand, ignoreCase: true, out FindingSemanticSupportBand band))
                continue;

            map[row.FindingId.Trim()] = new FindingSemanticSupportBandOverlayRecord
            {
                FindingId = row.FindingId.Trim(),
                Band = band,
                ScorerVersion = row.ScorerVersion ?? string.Empty,
                EvidenceExcerptHashSha256 = row.EvidenceExcerptHashSha256,
                ScoredAtUtc = row.ScoredAtUtc,
                UpdatedUtc = row.UpdatedUtc,
                FrozenAtUtc = row.FrozenAtUtc,
            };
        }

        return map;
    }

    public async Task FreezeSnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           UPDATE dbo.FindingSemanticSupportBandOverlays
                           SET FrozenAtUtc = COALESCE(FrozenAtUtc, @FrozenAtUtc),
                               UpdatedUtc = @UpdatedUtc
                           WHERE FindingsSnapshotId = @FindingsSnapshotId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    FindingsSnapshotId = findingsSnapshotId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    FrozenAtUtc = utcNow,
                    UpdatedUtc = utcNow,
                },
                cancellationToken: cancellationToken));
    }

    private sealed class Row
    {
        public string? FindingId
        {
            get;
            init;
        }

        public string? SemanticSupportBand
        {
            get;
            init;
        }

        public string? ScorerVersion
        {
            get;
            init;
        }

        public string? EvidenceExcerptHashSha256
        {
            get;
            init;
        }

        public DateTime ScoredAtUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public DateTime? FrozenAtUtc
        {
            get;
            init;
        }
    }
}
