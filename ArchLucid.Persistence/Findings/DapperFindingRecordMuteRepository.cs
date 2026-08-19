using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

/// <summary>Dapper implementation for <see cref="IFindingRecordMuteRepository" />.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent; covered via API integration tests.")]
public sealed class DapperFindingRecordMuteRepository(ISqlConnectionFactory connectionFactory)
    : IFindingRecordMuteRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, FindingMuteFlag>> GetMuteFlagsAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT fr.FindingId,
                                  CASE
                                      WHEN fr.IsMuted = 1
                                           AND (fr.MuteExpiresAtUtc IS NULL OR fr.MuteExpiresAtUtc > SYSUTCDATETIME())
                                          THEN CAST(1 AS bit)
                                      ELSE CAST(0 AS bit)
                                  END AS IsMuted,
                                  fr.MuteReason,
                                  fr.MuteExpiresAtUtc
                           FROM dbo.FindingRecords fr
                           WHERE fr.FindingsSnapshotId = @FsId
                             AND fr.TenantId = @TenantId
                             AND fr.WorkspaceId = @WorkspaceId
                             AND fr.ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        List<Row> rows = (
            await connection.QueryAsync<Row>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        FsId = findingsSnapshotId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId
                    },
                    cancellationToken: ct))).ToList();

        Dictionary<string, FindingMuteFlag> map = new(StringComparer.Ordinal);

        foreach (Row row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.FindingId))
                continue;

            map[row.FindingId.Trim()] = new FindingMuteFlag(row.IsMuted, row.MuteReason, row.MuteExpiresAtUtc);
        }

        return map;
    }

    /// <inheritdoc />
    public async Task<bool> TryMuteAsync(
        Guid runId,
        string findingId,
        string reason,
        ScopeContext scope,
        CancellationToken ct,
        DateTimeOffset? expiresAtUtc = null)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        const string sql = """
                           UPDATE fr
                           SET fr.IsMuted = 1,
                               fr.MuteReason = @Reason,
                               fr.MuteExpiresAtUtc = @MuteExpiresAtUtc
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.FindingId = @FindingId
                             AND r.RunId = @RunId
                             AND r.TenantId = @TenantId
                             AND r.WorkspaceId = @WorkspaceId
                             AND r.ScopeProjectId = @ScopeProjectId
                             AND fr.TenantId = @TenantId
                             AND fr.WorkspaceId = @WorkspaceId
                             AND fr.ProjectId = @ProjectId
                             AND (r.ArchivedUtc IS NULL);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    FindingId = findingId.Trim(),
                    RunId = runId,
                    Reason = reason,
                    MuteExpiresAtUtc = expiresAtUtc?.UtcDateTime,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId
                },
                cancellationToken: ct));

        return affected > 0;
    }

    private sealed class Row
    {
        public string FindingId
        {
            get;
            init;
        } = "";

        public bool IsMuted
        {
            get;
            init;
        }

        public string? MuteReason
        {
            get;
            init;
        }

        public DateTime? MuteExpiresAtUtc
        {
            get;
            init;
        }
    }
}
