using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IUserSettingsRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via DbUp integration tests.")]
public sealed class DapperUserSettingsRepository(ISqlConnectionFactory connectionFactory) : IUserSettingsRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<string?> TryGetAsync(string userId, string preferenceKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceKey);

        const string sql = """
                           SELECT PreferenceValue
                           FROM dbo.UserSettings
                           WHERE UserId = @UserId
                             AND PreferenceKey = @PreferenceKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? value = await connection.QuerySingleOrDefaultAsync<string>(
            new CommandDefinition(
                sql,
                new { UserId = userId.Trim(), PreferenceKey = preferenceKey.Trim() },
                cancellationToken: cancellationToken));

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    /// <inheritdoc />
    public async Task UpsertAsync(
        string userId,
        string preferenceKey,
        string preferenceValue,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceValue);

        const string sql = """
                           MERGE dbo.UserSettings AS target
                           USING (SELECT @UserId AS UserId, @PreferenceKey AS PreferenceKey) AS source
                           ON target.UserId = source.UserId AND target.PreferenceKey = source.PreferenceKey
                           WHEN MATCHED THEN
                               UPDATE SET PreferenceValue = @PreferenceValue, UpdatedUtc = SYSUTCDATETIME()
                           WHEN NOT MATCHED THEN
                               INSERT (UserId, PreferenceKey, PreferenceValue, UpdatedUtc)
                               VALUES (@UserId, @PreferenceKey, @PreferenceValue, SYSUTCDATETIME());
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    UserId = userId.Trim(),
                    PreferenceKey = preferenceKey.Trim(),
                    PreferenceValue = preferenceValue.Trim()
                },
                cancellationToken: cancellationToken));
    }
}
