using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Budgeting;

/// <inheritdoc cref="IRunScopedLlmBudgetReservationStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; unit-tested via in-memory counterpart.")]
public sealed class DapperRunScopedLlmBudgetReservationStore(IDbConnectionFactory connectionFactory)
    : IRunScopedLlmBudgetReservationStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<RunScopedLlmBudgetReservationStoreResult> TryReserveAsync(
        RunScopedLlmBudgetReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        byte[] idempotencyHash = HashIdempotencyKey(request.IdempotencyKey);
        decimal hardCapWithGrace = RunScopedLlmBudgetGrace.ApplyGrace(
            request.HardCapUsd,
            request.AccountingGracePercent);
        DateTime expiresUtc = request.UtcNow.Add(request.ReservationTtl).UtcDateTime;

        DynamicParameters parameters = new();
        parameters.Add("@ReservationId", request.ReservationId);
        parameters.Add("@TenantId", request.TenantId);
        parameters.Add("@RunId", request.RunId);
        parameters.Add("@IdempotencyKeyHash", idempotencyHash);
        parameters.Add("@PeriodKey", request.PeriodKey);
        parameters.Add("@ReserveUsd", request.ReserveUsd);
        parameters.Add("@CurrentPressureUsd", request.CurrentPressureUsd);
        parameters.Add("@HardCapUsd", hardCapWithGrace);
        parameters.Add("@ExpiresUtc", expiresUtc);
        parameters.Add("@Allowed", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("@ReservationIdOut", dbType: DbType.Guid, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_RunScopedLlmBudget_TryReserve",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));

        bool allowed = parameters.Get<bool>("@Allowed");

        if (!allowed)
        {
            return RunScopedLlmBudgetReservationStoreResult.Reject(
                RunScopedLlmBudgetReservationStoreRejectionReason.MonthlyCeilingExceeded);
        }

        Guid reservationIdOut = parameters.Get<Guid>("@ReservationIdOut");

        return RunScopedLlmBudgetReservationStoreResult.Permit(reservationIdOut);
    }

    /// <inheritdoc />
    public async Task CommitAsync(Guid reservationId, decimal actualUsd, CancellationToken cancellationToken = default)
    {
        if (actualUsd < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(actualUsd));
        }

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_RunScopedLlmBudget_Commit",
                new { ReservationId = reservationId, ActualUsd = actualUsd },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_RunScopedLlmBudget_Release",
                new { ReservationId = reservationId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    private static byte[] HashIdempotencyKey(string idempotencyKey)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKey);

        return SHA256.HashData(Encoding.UTF8.GetBytes(idempotencyKey.Trim()));
    }
}
