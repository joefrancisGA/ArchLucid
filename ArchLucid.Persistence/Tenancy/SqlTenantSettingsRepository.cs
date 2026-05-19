using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API integration tests.")]
public sealed class SqlTenantSettingsRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantSettingsRepository
{
    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<string?> TryGetAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => TryGetCoreAsync(tenantId, settingKey, ct),
            cancellationToken);

    public Task UpsertAsync(Guid tenantId, string settingKey, string settingValue, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => UpsertCoreAsync(tenantId, settingKey, settingValue, ct),
            cancellationToken);

    public Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => DeleteCoreAsync(tenantId, settingKey, ct),
            cancellationToken);

    private async Task<string?> TryGetCoreAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        const string sql = """
                             SELECT SettingValue
                             FROM dbo.TenantSettings
                             WHERE TenantId = @TenantId
                               AND SettingKey = @SettingKey;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? value = await connection.QuerySingleOrDefaultAsync<string>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, SettingKey = settingKey.Trim() },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private async Task UpsertCoreAsync(
        Guid tenantId,
        string settingKey,
        string settingValue,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(settingValue);

        const string sql = """
                             MERGE dbo.TenantSettings AS target
                             USING (SELECT @TenantId AS TenantId, @SettingKey AS SettingKey) AS source
                             ON target.TenantId = source.TenantId AND target.SettingKey = source.SettingKey
                             WHEN MATCHED THEN
                                 UPDATE SET SettingValue = @SettingValue, UpdatedUtc = SYSUTCDATETIME()
                             WHEN NOT MATCHED THEN
                                 INSERT (TenantId, SettingKey, SettingValue, UpdatedUtc)
                                 VALUES (@TenantId, @SettingKey, @SettingValue, SYSUTCDATETIME());
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        SettingKey = settingKey.Trim(),
                        SettingValue = settingValue.Trim()
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task DeleteCoreAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        const string sql = """
                             DELETE FROM dbo.TenantSettings
                             WHERE TenantId = @TenantId
                               AND SettingKey = @SettingKey;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, SettingKey = settingKey.Trim() },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }
}
