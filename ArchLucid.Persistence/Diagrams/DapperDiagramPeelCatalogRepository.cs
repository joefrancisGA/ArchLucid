using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Core.Diagrams;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Diagrams;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class DapperDiagramPeelCatalogRepository(ISqlConnectionFactory connectionFactory)
    : IDiagramPeelCatalogRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<int> CountAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                "SELECT COUNT(1) FROM dbo.DiagramPeelCatalogEntry WITH (NOLOCK);",
                cancellationToken: cancellationToken));
    }

    public async Task<int> GetCatalogVersionAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int? version = await connection.ExecuteScalarAsync<int?>(
            new CommandDefinition(
                "SELECT TOP (1) CatalogVersion FROM dbo.DiagramPeelCatalogVersion WITH (NOLOCK);",
                cancellationToken: cancellationToken));

        return version ?? DiagramPeelCatalogDefaultSeed.DefaultCatalogVersion;
    }

    public async Task<IReadOnlyList<DiagramPeelCatalogEntry>> ListEntriesAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<DiagramPeelCatalogRepositoryCore.EntryDbRow> rows =
            await connection.QueryAsync<DiagramPeelCatalogRepositoryCore.EntryDbRow>(
                new CommandDefinition(
                    """
                    SELECT ArmResourceType, PeelRank, IsEnabled, Notes
                    FROM dbo.DiagramPeelCatalogEntry WITH (NOLOCK)
                    ORDER BY PeelRank, ArmResourceType;
                    """,
                    cancellationToken: cancellationToken));

        return rows.Select(DiagramPeelCatalogRepositoryCore.MapEntry).ToList();
    }

    public async Task UpsertEntryAsync(DiagramPeelCatalogEntry entry, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(entry);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                MERGE dbo.DiagramPeelCatalogEntry AS target
                USING (SELECT @ArmResourceType AS ArmResourceType) AS source
                ON target.ArmResourceType = source.ArmResourceType
                WHEN MATCHED THEN
                    UPDATE SET
                        PeelRank = @PeelRank,
                        IsEnabled = @IsEnabled,
                        Notes = @Notes,
                        UpdatedUtc = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT (ArmResourceType, PeelRank, IsEnabled, Notes)
                    VALUES (@ArmResourceType, @PeelRank, @IsEnabled, @Notes);
                """,
                new
                {
                    entry.ArmResourceType,
                    entry.PeelRank,
                    entry.IsEnabled,
                    entry.Notes,
                },
                cancellationToken: cancellationToken));
    }
}
