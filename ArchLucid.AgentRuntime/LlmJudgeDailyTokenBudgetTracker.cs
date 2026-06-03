using System.Globalization;

using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-day judge-only token totals per tenant (<see cref="LlmBudgetPeriod.JudgeDaily" />), isolated from
///     <see cref="LlmDailyTenantBudgetTracker" />.
/// </summary>
public sealed class LlmJudgeDailyTokenBudgetTracker(
    IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions> optionsMonitor,
    ILlmTenantBudgetRepository budgetRepository) : ILlmJudgeBudgetTracker
{
    private const int MaxOptimisticRetries = 12;

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task<bool> TryPeekWithinBudgetAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            return true;

        LlmJudgeDailyTokenBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return true;

        int assumed = Math.Clamp(opts.AssumedMaxTotalTokensPerRequest, 1, 2_000_000);
        long max = opts.HardCutoffTokensPerUtcDay;
        string periodKey = DailyPeriodKey(TimeProvider.System.UtcToday());

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.JudgeDaily, periodKey, cancellationToken)
                .ConfigureAwait(false);

        return state.TotalTokenPressure + assumed <= max;
    }

    /// <inheritdoc />
    public void RecordBudgetExhausted() => ArchLucidInstrumentation.LlmJudgeBudgetExhaustedTotal.Add(1);

    /// <summary>Pre-call reserve against the judge pool; throws when hard cap would be exceeded.</summary>
    public async Task<long?> EnsureWithinBudgetBeforeCallAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return null;

        LlmJudgeDailyTokenBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return null;

        int assumed = Math.Clamp(opts.AssumedMaxTotalTokensPerRequest, 1, 2_000_000);
        long max = opts.HardCutoffTokensPerUtcDay;
        string periodKey = DailyPeriodKey(TimeProvider.System.UtcToday());

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.JudgeDaily, periodKey, cancellationToken)
                .ConfigureAwait(false);

        if (state.TotalTokenPressure + assumed > max)
        {
            RecordBudgetExhausted();

            DateTimeOffset retryAfterUtc =
                new(TimeProvider.System.UtcNowDateTime().Date.AddDays(1), TimeSpan.Zero);

            throw new LlmTokenQuotaExceededException(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "LLM judge daily token budget exceeded for tenant (UTC day cap {0}, used ~{1}).",
                    max,
                    state.TotalTokenPressure),
                retryAfterUtc);
        }

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            state =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.JudgeDaily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetReserveResult reserved = await _budgetRepository
                .ReserveAsync(
                    new LlmTenantBudgetReserveRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.JudgeDaily,
                        PeriodKey = periodKey,
                        ReserveTokens = assumed,
                        HardCapTokens = max,
                        ExpectedRowVersion = state.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (reserved.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (reserved.HardCapBlocked)
            {
                RecordBudgetExhausted();

                LlmTenantBudgetStateReadModel blocked = reserved.NewState ?? state;
                DateTimeOffset retryAfterUtc =
                    new(TimeProvider.System.UtcNowDateTime().Date.AddDays(1), TimeSpan.Zero);

                throw new LlmTokenQuotaExceededException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "LLM judge daily token budget exceeded for tenant (UTC day cap {0}, used ~{1}).",
                        max,
                        blocked.TotalTokenPressure),
                    retryAfterUtc);
            }

            return assumed;
        }

        throw new InvalidOperationException("LLM judge daily token budget reserve could not complete after optimistic retries.");
    }

    /// <summary>Accumulates judge completion token usage into the judge UTC-day pool.</summary>
    public async Task RecordUsageAsync(
        Guid tenantId,
        string providerKind,
        int promptTokens,
        int completionTokens,
        long? pendingReserved,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmJudgeDailyTokenBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        if (promptTokens < 1 && completionTokens < 1)
            return;

        long added = Math.Max(0, promptTokens) + (long)Math.Max(0, completionTokens);
        string periodKey = DailyPeriodKey(TimeProvider.System.UtcToday());

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.JudgeDaily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.JudgeDaily,
                        PeriodKey = periodKey,
                        ActualTokens = added,
                        ReleaseReservedTokens = pendingReserved ?? 0L,
                        WarnAtTokens = long.MaxValue,
                        ExpectedRowVersion = read.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (settled.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            return;
        }

        throw new InvalidOperationException("LLM judge daily token budget could not be updated after optimistic retries.");
    }

    /// <summary>Releases a pre-call reservation when no completion usage was recorded.</summary>
    public async Task ReleasePendingReservationIfAnyAsync(
        Guid tenantId,
        string providerKind,
        long? pending,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmJudgeDailyTokenBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        if (pending is null or < 1)
            return;

        string periodKey = DailyPeriodKey(TimeProvider.System.UtcToday());

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.JudgeDaily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.JudgeDaily,
                        PeriodKey = periodKey,
                        ActualTokens = 0L,
                        ReleaseReservedTokens = pending.Value,
                        WarnAtTokens = long.MaxValue,
                        ExpectedRowVersion = read.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (settled.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            return;
        }

        throw new InvalidOperationException("LLM judge daily token budget reservation could not be released after optimistic retries.");
    }

    private static string DailyPeriodKey(DateOnly utcDay) =>
        utcDay.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
