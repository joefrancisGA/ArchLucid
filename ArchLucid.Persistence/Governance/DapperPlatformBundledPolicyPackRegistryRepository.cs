using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL persistence for <c>dbo.PlatformBundledPolicyPackRegistry</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperPlatformBundledPolicyPackRegistryRepository(ISqlConnectionFactory connectionFactory)
    : IPlatformBundledPolicyPackRegistryRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<IReadOnlyList<PlatformBundledPolicyPackRegistryEntry>> ListAllAsync(CancellationToken ct)
    {
        const string sql = """
                           SELECT
                               BundleContentFile,
                               DisplayName,
                               IsGloballyActive,
                               UpdatedUtc
                           FROM dbo.PlatformBundledPolicyPackRegistry WITH (NOLOCK)
                           ORDER BY DisplayName ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<PlatformBundledPolicyPackRegistryEntry> rows =
            await connection.QueryAsync<PlatformBundledPolicyPackRegistryEntry>(
                new CommandDefinition(sql, cancellationToken: ct));

        return rows.ToList();
    }

    public async Task UpsertAsync(PlatformBundledPolicyPackRegistryEntry entry, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(entry);

        const string sql = """
                           MERGE dbo.PlatformBundledPolicyPackRegistry AS target
                           USING (SELECT @BundleContentFile AS BundleContentFile) AS source
                           ON target.BundleContentFile = source.BundleContentFile
                           WHEN MATCHED THEN
                               UPDATE SET
                                   DisplayName = @DisplayName,
                                   UpdatedUtc = SYSUTCDATETIME()
                           WHEN NOT MATCHED THEN
                               INSERT (BundleContentFile, DisplayName, IsGloballyActive, UpdatedUtc)
                               VALUES (@BundleContentFile, @DisplayName, 1, SYSUTCDATETIME());
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    entry.BundleContentFile,
                    entry.DisplayName,
                },
                cancellationToken: ct));
    }

    public async Task<bool> TrySetGloballyActiveAsync(string bundleContentFile, bool isGloballyActive, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(bundleContentFile))
            return false;

        const string sql = """
                           UPDATE dbo.PlatformBundledPolicyPackRegistry
                           SET
                               IsGloballyActive = @IsGloballyActive,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE BundleContentFile = @BundleContentFile;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    BundleContentFile = bundleContentFile.Trim(),
                    IsGloballyActive = isGloballyActive,
                },
                cancellationToken: ct));

        return affected > 0;
    }
}
