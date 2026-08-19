using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

/// <inheritdoc cref="IQuickScanSafetyOperationalStateStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; integration-tested via in-memory counterpart.")]
public sealed class DapperQuickScanSafetyOperationalStateStore(IDbConnectionFactory connectionFactory)
    : IQuickScanSafetyOperationalStateStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<QuickScanSafetyOperationalOverrideRow?> GetOverrideAsync(CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        OperationalOverrideRecord? record = await connection.QuerySingleOrDefaultAsync<OperationalOverrideRecord>(
            new CommandDefinition(
                "dbo.usp_QuickScanSafetyOperational_Get",
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (record is null)
        {
            return null;
        }

        return Map(record);
    }

    /// <inheritdoc />
    public async Task SetOverrideAsync(
        QuickScanSafetyOperationalOverrideWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanSafetyOperational_Set",
                new
                {
                    Mode = (byte)request.Mode,
                    PublicMessage = request.PublicMessage,
                    Reason = request.Reason,
                    ActorUserId = request.ActorUserId,
                    UpdatedUtc = request.UpdatedUtc.UtcDateTime,
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    private static QuickScanSafetyOperationalOverrideRow Map(OperationalOverrideRecord record) =>
        new()
        {
            Mode = (QuickScanSafetyOperationalMode)record.Mode,
            PublicMessage = record.PublicMessage,
            Reason = record.Reason,
            ActorUserId = record.ActorUserId,
            UpdatedUtc = DateTime.SpecifyKind(record.UpdatedUtc, DateTimeKind.Utc),
        };

    private sealed class OperationalOverrideRecord
    {
        public byte Mode { get; init; }

        public string PublicMessage { get; init; } = string.Empty;

        public string Reason { get; init; } = string.Empty;

        public string ActorUserId { get; init; } = string.Empty;

        public DateTime UpdatedUtc { get; init; }
    }
}
