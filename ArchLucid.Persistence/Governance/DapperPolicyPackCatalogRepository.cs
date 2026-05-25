using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL persistence for <c>dbo.PolicyPackCatalogEntry</c> (global catalog snapshots).</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperPolicyPackCatalogRepository(ISqlConnectionFactory connectionFactory) : IPolicyPackCatalogRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPackCatalogListItem>> ListPromotedAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT
                               PolicyPackCatalogEntryId,
                               DisplayName,
                               Description,
                               PackType,
                               SnapshotVersion,
                               SourcePolicyPackId,
                               PromotedUtc
                           FROM dbo.PolicyPackCatalogEntry WITH (NOLOCK)
                           WHERE IsPromoted = 1
                           ORDER BY DisplayName ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<PolicyPackCatalogListItem> rows = await connection.QueryAsync<PolicyPackCatalogListItem>(
            new CommandDefinition(sql, cancellationToken: ct));
        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task<PolicyPackCatalogEntryDetail?> GetPromotedDetailByIdAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT TOP (1)
                               PolicyPackCatalogEntryId,
                               DisplayName,
                               Description,
                               PackType,
                               SnapshotVersion,
                               SourcePolicyPackId,
                               PromotedUtc,
                               SnapshotContentJson
                           FROM dbo.PolicyPackCatalogEntry WITH (NOLOCK)
                           WHERE PolicyPackCatalogEntryId = @PolicyPackCatalogEntryId
                             AND IsPromoted = 1;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<PolicyPackCatalogEntryDetail>(
            new CommandDefinition(sql, new { PolicyPackCatalogEntryId = policyPackCatalogEntryId }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE dbo.PolicyPackCatalogEntry
                           SET
                               IsPromoted = 0,
                               UpdatedUtc = SYSUTCDATETIME(),
                               DemotedUtc = SYSUTCDATETIME()
                           WHERE PolicyPackCatalogEntryId = @PolicyPackCatalogEntryId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { PolicyPackCatalogEntryId = policyPackCatalogEntryId }, cancellationToken: ct));
        return affected > 0;
    }

    /// <inheritdoc />
    public async Task<PolicyPackCatalogEntryDetail> UpsertPromotedFromSnapshotAsync(
        Guid sourcePolicyPackId,
        string displayName,
        string description,
        string packType,
        string snapshotVersion,
        string snapshotContentJson,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(packType);
        ArgumentException.ThrowIfNullOrWhiteSpace(snapshotVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(snapshotContentJson);

        const string mergeSql = """
                                DECLARE @Id UNIQUEIDENTIFIER =
                                    (SELECT PolicyPackCatalogEntryId FROM dbo.PolicyPackCatalogEntry WHERE SourcePolicyPackId = @SourcePolicyPackId);

                                IF @Id IS NULL
                                BEGIN
                                    SET @Id = NEWSEQUENTIALID();
                                    INSERT INTO dbo.PolicyPackCatalogEntry
                                    (
                                        PolicyPackCatalogEntryId, DisplayName, Description, PackType,
                                        SnapshotVersion, SnapshotContentJson, SourcePolicyPackId,
                                        IsPromoted, CreatedUtc, UpdatedUtc, PromotedUtc, DemotedUtc
                                    )
                                    VALUES
                                    (
                                        @Id, @DisplayName, @Description, @PackType,
                                        @SnapshotVersion, @SnapshotContentJson, @SourcePolicyPackId,
                                        1, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME(), NULL
                                    );
                                END
                                ELSE
                                BEGIN
                                    UPDATE dbo.PolicyPackCatalogEntry
                                    SET
                                        DisplayName = @DisplayName,
                                        Description = @Description,
                                        PackType = @PackType,
                                        SnapshotVersion = @SnapshotVersion,
                                        SnapshotContentJson = @SnapshotContentJson,
                                        IsPromoted = 1,
                                        UpdatedUtc = SYSUTCDATETIME(),
                                        PromotedUtc = SYSUTCDATETIME(),
                                        DemotedUtc = NULL
                                    WHERE PolicyPackCatalogEntryId = @Id;
                                END

                                SELECT TOP (1)
                                    PolicyPackCatalogEntryId,
                                    DisplayName,
                                    Description,
                                    PackType,
                                    SnapshotVersion,
                                    SourcePolicyPackId,
                                    PromotedUtc,
                                    SnapshotContentJson
                                FROM dbo.PolicyPackCatalogEntry
                                WHERE PolicyPackCatalogEntryId = @Id;
                                """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        PolicyPackCatalogEntryDetail? row = await connection.QueryFirstOrDefaultAsync<PolicyPackCatalogEntryDetail>(
            new CommandDefinition(
                mergeSql,
                new
                {
                    SourcePolicyPackId = sourcePolicyPackId,
                    DisplayName = displayName,
                    Description = description,
                    PackType = packType,
                    SnapshotVersion = snapshotVersion,
                    SnapshotContentJson = snapshotContentJson
                },
                cancellationToken: ct));

        if (row is null)
            throw new InvalidOperationException("Policy pack catalog upsert returned no row.");

        return row;
    }
}
