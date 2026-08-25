using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Durable LLM tenant budgets: UTC-day tokens and UTC-month USD with optimistic concurrency.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration or in-memory test double.")]
public sealed partial class SqlLlmTenantBudgetRepository(IDbConnectionFactory connectionFactory) : ILlmTenantBudgetRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        LlmBudgetPeriod period,
        string periodKey,
        CancellationToken cancellationToken = default)
    {
        return period switch
        {
            LlmBudgetPeriod.Daily => await GetOrCreateDailyAsync(tenantId, periodKey, cancellationToken).ConfigureAwait(false),
            LlmBudgetPeriod.JudgeDaily => await GetOrCreateJudgeDailyAsync(tenantId, periodKey, cancellationToken).ConfigureAwait(false),
            LlmBudgetPeriod.Monthly => await GetOrCreateMonthlyAsync(tenantId, periodKey, cancellationToken).ConfigureAwait(false),
            _ => throw new ArgumentOutOfRangeException(nameof(period), period, null)
        };
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetReserveResult> ReserveAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        return request.Period switch
        {
            LlmBudgetPeriod.Daily => ReserveDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.JudgeDaily => ReserveJudgeDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.Monthly => ReserveMonthlyAsync(request, cancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(request), request.Period, null)
        };
    }

    /// <inheritdoc />
    public Task<LlmTenantBudgetSettleResult> SettleAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ExpectedRowVersion);

        if (string.IsNullOrWhiteSpace(request.PeriodKey))
            throw new ArgumentException("Period key is required.", nameof(request));

        return request.Period switch
        {
            LlmBudgetPeriod.Daily => SettleDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.JudgeDaily => SettleJudgeDailyAsync(request, cancellationToken),
            LlmBudgetPeriod.Monthly => SettleMonthlyAsync(request, cancellationToken),
            _ => throw new ArgumentOutOfRangeException(nameof(request), request.Period, null)
        };
    }
}
