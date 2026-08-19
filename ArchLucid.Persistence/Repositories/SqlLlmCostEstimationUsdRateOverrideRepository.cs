using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>SQL Server persistence for <see cref="LlmCostEstimationUsdRateOverrideRow" />.</summary>
public sealed class SqlLlmCostEstimationUsdRateOverrideRepository(ISqlConnectionFactory connectionFactory)
    : ILlmCostEstimationUsdRateOverrideRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmCostEstimationUsdRateOverrideRow?> TryGetAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                             SELECT TOP (1)
                                    InputUsdPerMillionTokens,
                                    OutputUsdPerMillionTokens,
                                    UpdatedUtc,
                                    UpdatedBy
                             FROM dbo.HostLlmCostEstimationUsdRates
                             WHERE SingletonKey = N'G';
                             """;

        CommandDefinition cd = new(sql, cancellationToken: cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<LlmCostEstimationUsdRateOverrideRow>(cd);
    }

    /// <inheritdoc />
    public async Task UpsertAsync(
        decimal inputUsdPerMillionTokens,
        decimal outputUsdPerMillionTokens,
        string updatedBy,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(updatedBy);
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        const string sql = """
                           IF EXISTS (SELECT 1 FROM dbo.HostLlmCostEstimationUsdRates WHERE SingletonKey = N'G')
                           BEGIN
                               UPDATE dbo.HostLlmCostEstimationUsdRates
                               SET InputUsdPerMillionTokens = @InputUsd,
                                   OutputUsdPerMillionTokens = @OutputUsd,
                                   UpdatedUtc = SYSUTCDATETIME(),
                                   UpdatedBy = @UpdatedBy
                               WHERE SingletonKey = N'G';
                           END
                           ELSE
                           BEGIN
                               INSERT INTO dbo.HostLlmCostEstimationUsdRates
                                   (SingletonKey, InputUsdPerMillionTokens, OutputUsdPerMillionTokens, UpdatedUtc, UpdatedBy)
                               VALUES
                                   (N'G', @InputUsd, @OutputUsd, SYSUTCDATETIME(), @UpdatedBy);
                           END
                           """;

        CommandDefinition cd = new(
            sql,
            new
            {
                InputUsd = inputUsdPerMillionTokens,
                OutputUsd = outputUsdPerMillionTokens,
                UpdatedBy = updatedBy
            },
            cancellationToken: cancellationToken);

        await connection.ExecuteAsync(cd);
    }
}
