using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

/// <inheritdoc cref="IQuickScanDistributedConcurrencyStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; integration-tested via in-memory counterpart.")]
public sealed class DapperQuickScanDistributedConcurrencyStore(IDbConnectionFactory connectionFactory)
    : IQuickScanDistributedConcurrencyStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<QuickScanConcurrencyAdmitResult> TryAdmitAsync(
        QuickScanConcurrencyAdmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        DynamicParameters parameters = new();
        parameters.Add("@LeaseId", request.LeaseId);
        parameters.Add("@QueueEntryId", request.QueueEntryId);
        parameters.Add("@RequestKey", request.RequestKey);
        parameters.Add("@MaxConcurrent", request.MaxConcurrentScans);
        parameters.Add("@MaxQueued", request.MaxQueuedScans);
        parameters.Add("@QueueWaitSeconds", (int)request.QueueWaitTimeout.TotalSeconds);
        parameters.Add("@LeaseDurationSeconds", (int)request.LeaseDuration.TotalSeconds);
        parameters.Add("@HolderInstanceId", request.HolderInstanceId);
        parameters.Add("@UtcNow", request.UtcNow.UtcDateTime);
        parameters.Add("@Outcome", dbType: DbType.Byte, direction: ParameterDirection.Output);
        parameters.Add("@LeaseIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);
        parameters.Add("@QueueEntryIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanConcurrency_TryAdmit",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        byte outcome = parameters.Get<byte>("@Outcome");

        return outcome switch
        {
            0 => QuickScanConcurrencyAdmitResult.DirectLease(parameters.Get<Guid>("@LeaseIdOut")),
            2 => QuickScanConcurrencyAdmitResult.Queued(parameters.Get<Guid>("@QueueEntryIdOut")),
            1 => QuickScanConcurrencyAdmitResult.QueueFull(),
            _ => QuickScanConcurrencyAdmitResult.Busy(),
        };
    }

    /// <inheritdoc />
    public async Task<QuickScanConcurrencyPromoteResult> TryPromoteAsync(
        QuickScanConcurrencyPromoteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        DynamicParameters parameters = new();
        parameters.Add("@QueueEntryId", request.QueueEntryId);
        parameters.Add("@LeaseId", request.LeaseId);
        parameters.Add("@MaxConcurrent", request.MaxConcurrentScans);
        parameters.Add("@LeaseDurationSeconds", (int)request.LeaseDuration.TotalSeconds);
        parameters.Add("@HolderInstanceId", request.HolderInstanceId);
        parameters.Add("@UtcNow", request.UtcNow.UtcDateTime);
        parameters.Add("@Promoted", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@LeaseIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanConcurrency_TryPromote",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        bool promoted = parameters.Get<bool>("@Promoted");

        if (!promoted)
        {
            return QuickScanConcurrencyPromoteResult.NotYet();
        }

        return QuickScanConcurrencyPromoteResult.Success(parameters.Get<Guid>("@LeaseIdOut"));
    }

    /// <inheritdoc />
    public async Task ReleaseLeaseAsync(Guid leaseId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanConcurrency_ReleaseLease",
                new { LeaseId = leaseId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task AbandonQueueEntryAsync(Guid queueEntryId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanConcurrency_AbandonQueue",
                new { QueueEntryId = queueEntryId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task RenewLeaseAsync(
        Guid leaseId,
        DateTimeOffset utcNow,
        TimeSpan leaseDuration,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanConcurrency_RenewLease",
                new
                {
                    LeaseId = leaseId,
                    UtcNow = utcNow.UtcDateTime,
                    LeaseDurationSeconds = (int)leaseDuration.TotalSeconds,
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}
