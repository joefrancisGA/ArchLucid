using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Dapper-backed persistence for <see cref="TechnologyLedgerEntry" /> entities. Columns map directly to
///     entry properties (no JSON blob) since every field is small and individually queryable — this keeps the
///     table directly queryable by a future technology-consistency validation engine.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class TechnologyLedgerRepository(IDbConnectionFactory connectionFactory)
    : ITechnologyLedgerRepository
{
    public async Task AddAsync(
        TechnologyLedgerEntry entry,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(entry);

        const string sql = """
                           INSERT INTO dbo.TechnologyLedgerEntries
                           (
                               EntryId,
                               RunId,
                               Role,
                               TechnologyName,
                               ProviderFamily,
                               Status,
                               Source,
                               EvidenceRef,
                               Rationale,
                               IsLocked,
                               CreatedUtc,
                               UpdatedUtc
                           )
                           VALUES
                           (
                               @EntryId,
                               @RunId,
                               @Role,
                               @TechnologyName,
                               @ProviderFamily,
                               @Status,
                               @Source,
                               @EvidenceRef,
                               @Rationale,
                               @IsLocked,
                               @CreatedUtc,
                               @UpdatedUtc
                           );
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                entry.EntryId,
                RunId = SqlRunIdMapping.ToSqlRunId(entry.RunId),
                Role = entry.Role.ToString(),
                entry.TechnologyName,
                ProviderFamily = entry.ProviderFamily.ToString(),
                Status = entry.Status.ToString(),
                Source = entry.Source.ToString(),
                entry.EvidenceRef,
                entry.Rationale,
                entry.IsLocked,
                entry.CreatedUtc,
                entry.UpdatedUtc,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string sql = $"""
                     SELECT
                         t.EntryId,
                         t.RunId,
                         t.Role,
                         t.TechnologyName,
                         t.ProviderFamily,
                         t.Status,
                         t.Source,
                         t.EvidenceRef,
                         t.Rationale,
                         t.IsLocked,
                         t.CreatedUtc,
                         t.UpdatedUtc
                     FROM dbo.TechnologyLedgerEntries t
                     {PersistenceTenantScope.InnerJoinRuns("t")}
                     WHERE t.RunId = @RunId
                       AND {PersistenceTenantScope.RunChildScopeWhereClause}
                     ORDER BY t.CreatedUtc;
                     """;

        IEnumerable<TechnologyLedgerEntryRow> rows = await connection.QueryAsync<TechnologyLedgerEntryRow>(
            new CommandDefinition(
                sql,
                new
                {
                    RunId = SqlRunIdMapping.ToSqlRunId(runId),
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(ToEntry).ToList();
    }

    public async Task UpdateAsync(
        TechnologyLedgerEntry entry,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(entry);

        const string sql = """
                           UPDATE dbo.TechnologyLedgerEntries
                           SET Role = @Role,
                               TechnologyName = @TechnologyName,
                               ProviderFamily = @ProviderFamily,
                               Status = @Status,
                               Source = @Source,
                               EvidenceRef = @EvidenceRef,
                               Rationale = @Rationale,
                               IsLocked = @IsLocked,
                               UpdatedUtc = @UpdatedUtc
                           WHERE EntryId = @EntryId;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                entry.EntryId,
                Role = entry.Role.ToString(),
                entry.TechnologyName,
                ProviderFamily = entry.ProviderFamily.ToString(),
                Status = entry.Status.ToString(),
                Source = entry.Source.ToString(),
                entry.EvidenceRef,
                entry.Rationale,
                entry.IsLocked,
                entry.UpdatedUtc,
            },
            cancellationToken: cancellationToken));
    }

    private static TechnologyLedgerEntry ToEntry(TechnologyLedgerEntryRow row) => new()
    {
        EntryId = row.EntryId,
        RunId = SqlRunIdMapping.ToContractRunId(row.RunId),
        Role = Enum.Parse<TechnologyLedgerRole>(row.Role),
        TechnologyName = row.TechnologyName,
        ProviderFamily = Enum.Parse<CloudProvider>(row.ProviderFamily),
        Status = Enum.Parse<TechnologyLedgerStatus>(row.Status),
        Source = Enum.Parse<TechnologyLedgerSource>(row.Source),
        EvidenceRef = row.EvidenceRef,
        Rationale = row.Rationale,
        IsLocked = row.IsLocked,
        CreatedUtc = row.CreatedUtc,
        UpdatedUtc = row.UpdatedUtc,
    };
}
