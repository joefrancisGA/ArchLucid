using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class TenantCuratedEvidenceRepository(IDbConnectionFactory connectionFactory)
    : ITenantCuratedEvidenceRepository
{
    public async Task<IReadOnlyList<TenantCuratedEvidenceEntryRow>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EntryType, CatalogEntryId, Title, Description, Rationale
                           FROM TenantCuratedEvidenceEntries
                           WHERE TenantId = @TenantId
                           ORDER BY PromotedUtc DESC;
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<TenantCuratedEvidenceEntryRow> rows;
        try
        {
            rows = await conn.QueryAsync<TenantCuratedEvidenceEntryRow>(new CommandDefinition(
                sql,
                new { TenantId = tenantId },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.ToList();
    }

    public async Task<Guid> InsertPromotedEntryAsync(
        Guid tenantId,
        string entryType,
        string catalogEntryId,
        string title,
        string description,
        string rationale,
        string sourceResultId,
        CancellationToken cancellationToken = default)
    {
        Guid entryId = Guid.NewGuid();

        const string sql = """
                           INSERT INTO TenantCuratedEvidenceEntries
                           (
                               EntryId,
                               TenantId,
                               EntryType,
                               CatalogEntryId,
                               Title,
                               Description,
                               Rationale,
                               SourceResultId,
                               PromotedUtc
                           )
                           VALUES
                           (
                               @EntryId,
                               @TenantId,
                               @EntryType,
                               @CatalogEntryId,
                               @Title,
                               @Description,
                               @Rationale,
                               @SourceResultId,
                               @PromotedUtc
                           );
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    EntryId = entryId,
                    TenantId = tenantId,
                    EntryType = entryType,
                    CatalogEntryId = catalogEntryId,
                    Title = title,
                    Description = description,
                    Rationale = rationale,
                    SourceResultId = sourceResultId,
                    PromotedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
                },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return entryId;
    }
}
