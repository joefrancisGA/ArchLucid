using System.Data;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAdvisoryTerraformRepresentationRepository(ISqlConnectionFactory connectionFactory)
    : IAdvisoryTerraformRepresentationRepository
{
    public async Task<IReadOnlyList<AdvisoryTerraformResourceMappingRecord>> ListMappingsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT MappingId, SnapshotId, CloudResourceId, AzureResourceId, TerraformAddress,
                                  CategoryFolder, GenerationMethod, UncertaintyNotes
                           FROM dbo.AdvisoryTerraformResourceMappings
                           WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId
                           ORDER BY AzureResourceId;
                           """;

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<MappingRow> rows = await conn.QueryAsync<MappingRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => new AdvisoryTerraformResourceMappingRecord
            {
                MappingId = r.MappingId,
                SnapshotId = snapshotId,
                CloudResourceId = r.CloudResourceId,
                AzureResourceId = r.AzureResourceId,
                TerraformAddress = r.TerraformAddress,
                CategoryFolder = r.CategoryFolder,
                GenerationMethod = (AdvisoryTerraformGenerationMethod)r.GenerationMethod,
                UncertaintyNotes = r.UncertaintyNotes,
            })
            .ToList();
    }

    public async Task ReplaceMappingsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(mappings);

        using IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Terraform mapping replace requires SqlConnection.");

        using IDbTransaction tx = sqlConn.BeginTransaction();

        try
        {
            const string deleteSql = """
                                     DELETE FROM dbo.AdvisoryTerraformResourceMappings
                                     WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                     """;

            await sqlConn.ExecuteAsync(
                new CommandDefinition(
                    deleteSql,
                    new { scope.TenantId, SnapshotId = snapshotId },
                    transaction: tx,
                    cancellationToken: cancellationToken));

            if (mappings.Count == 0)
            {
                tx.Commit();
                return;
            }

            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            const string insertSql = """
                                     INSERT INTO dbo.AdvisoryTerraformResourceMappings
                                     (
                                         MappingId, SnapshotId, TenantId, CloudResourceId, AzureResourceId,
                                         TerraformAddress, CategoryFolder, GenerationMethod, UncertaintyNotes, CreatedUtc
                                     )
                                     VALUES
                                     (
                                         @MappingId, @SnapshotId, @TenantId, @CloudResourceId, @AzureResourceId,
                                         @TerraformAddress, @CategoryFolder, @GenerationMethod, @UncertaintyNotes, @CreatedUtc
                                     );
                                     """;

            foreach (AdvisoryTerraformResourceMappingRecord mapping in mappings)
            {
                await sqlConn.ExecuteAsync(
                    new CommandDefinition(
                        insertSql,
                        new
                        {
                            mapping.MappingId,
                            SnapshotId = snapshotId,
                            scope.TenantId,
                            mapping.CloudResourceId,
                            mapping.AzureResourceId,
                            mapping.TerraformAddress,
                            mapping.CategoryFolder,
                            GenerationMethod = (int)mapping.GenerationMethod,
                            mapping.UncertaintyNotes,
                            CreatedUtc = utcNow,
                        },
                        transaction: tx,
                        commandTimeout: DapperCommandTimeoutSeconds.Report,
                        cancellationToken: cancellationToken));
            }

            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private sealed class MappingRow
    {
        public Guid MappingId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string AzureResourceId
        {
            get;
            init;
        } = string.Empty;

        public string TerraformAddress
        {
            get;
            init;
        } = string.Empty;

        public string CategoryFolder
        {
            get;
            init;
        } = string.Empty;

        public int GenerationMethod
        {
            get;
            init;
        }

        public string? UncertaintyNotes
        {
            get;
            init;
        }
    }
}
