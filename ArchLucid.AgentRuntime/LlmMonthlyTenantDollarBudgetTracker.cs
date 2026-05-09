using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-month estimated USD spend per tenant for <see cref="LlmMonthlyTenantDollarBudgetOptions" /> (warn once,
///     hard stop), backed by <see cref="ILlmTenantBudgetRepository" /> with pre-call reserve and post-call settle
///     (INV-004).
/// </summary>
public sealed class LlmMonthlyTenantDollarBudgetTracker(
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> optionsMonitor,
    ILlmCostEstimator costEstimator,
    ILlmTenantBudgetRepository budgetRepository)
{
    private const int MaxOptimisticRetries = 12;

    private static readonly AsyncLocal<decimal?> PendingReservedAssumedUsd = new();

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly ILlmCostEstimator _costEstimator = costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <summary>
    ///     Throws <see cref="LlmTokenQuotaExceededException" /> when the next call would exceed the UTC-month hard
    ///     cutoff.
    /// </summary>
    public async Task EnsureWithinBudgetBeforeCallAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return;

        int assumedPrompt = Math.Clamp(opts.AssumedMaxPromptTokensPerRequest, 1, 1_000_000);
        int assumedCompletion = Math.Clamp(opts.AssumedMaxCompletionTokensPerRequest, 1, 262_144);
        decimal? assumedUsd = _costEstimator.EstimateUsd(assumedPrompt, assumedCompletion);
        decimal assumed = assumedUsd ?? 0m;

        if (assumed <= 0m)
            return;

        string periodKey = MonthlyPeriodKey(GetUtcYearMonth());
        decimal max = opts.HardCutoffUsdPerUtcMonth;

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                .ConfigureAwait(false);

        if (state.TotalUsdPressure + assumed > max)
        {
            (int year, int month) = GetUtcYearMonth();
            DateTimeOffset retryAfterUtc = FirstInstantOfNextUtcMonth(year, month);

            throw new LlmTokenQuotaExceededException(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "LLM monthly dollar budget exceeded for tenant (UTC month hard cap {0:C}, used ~{1:C}).",
                    max,
                    state.TotalUsdPressure),
                retryAfterUtc);
        }

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            state =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetReserveResult reserved = await _budgetRepository
                .ReserveAsync(
                    new LlmTenantBudgetReserveRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Monthly,
                        PeriodKey = periodKey,
                        ReserveUsd = assumed,
                        HardCapUsd = max,
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
                LlmTenantBudgetStateReadModel blocked = reserved.NewState ?? state;
                (int year, int month) = GetUtcYearMonth();
                DateTimeOffset retryAfterUtc = FirstInstantOfNextUtcMonth(year, month);

                throw new LlmTokenQuotaExceededException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "LLM monthly dollar budget exceeded for tenant (UTC month hard cap {0:C}, used ~{1:C}).",
                        max,
                        blocked.TotalUsdPressure),
                    retryAfterUtc);
            }

            PendingReservedAssumedUsd.Value = assumed;

            return;
        }

        throw new InvalidOperationException("LLM monthly dollar budget reserve could not complete after optimistic retries.");
    }

    /// <summary>Accumulates estimated USD and fires the once-per-UTC-month warning audit when crossing the warn threshold.</summary>
    public async Task RecordUsageAndMaybeWarnAsync(
        Guid tenantId,
        string providerKind,
        IScopeContextProvider scopeProvider,
        IAuditService? auditService,
        int promptTokens,
        int completionTokens,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.IncludedUsdPerUtcMonth < 0.01m || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return;

        if (promptTokens < 1 && completionTokens < 1)
            return;

        decimal? addUsd = _costEstimator.EstimateUsd(promptTokens, completionTokens);

        if (addUsd is null or <= 0m)
            return;

        decimal warnAt = decimal.Round(
            opts.IncludedUsdPerUtcMonth * decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m),
            4,
            MidpointRounding.AwayFromZero);

        string periodKey = MonthlyPeriodKey(GetUtcYearMonth());
        decimal? pendingReserved = PendingReservedAssumedUsd.Value;

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Monthly,
                        PeriodKey = periodKey,
                        ActualUsd = addUsd.Value,
                        ReleaseReservedUsd = pendingReserved ?? 0m,
                        WarnAtUsd = warnAt,
                        ExpectedRowVersion = read.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (settled.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            PendingReservedAssumedUsd.Value = null;

            decimal newTotal =
                settled.NewState?.CommittedUsd ?? throw new InvalidOperationException("Missing spend state after update.");

            if (!settled.ShouldEmitWarnAudit || auditService is null)
                return;

            (int year, int month) = GetUtcYearMonth();
            TryScheduleWarnAudit(scopeProvider, auditService, year, month, newTotal, warnAt, opts);

            return;
        }

        throw new InvalidOperationException("LLM monthly dollar budget could not be updated after optimistic retries.");
    }

    /// <summary>Releases a pre-call reservation when no completion usage was recorded (failed provider call).</summary>
    public async Task ReleasePendingReservationIfAnyAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
            return;

        decimal? pending = PendingReservedAssumedUsd.Value;

        if (pending is null or <= 0m)
            return;

        string periodKey = MonthlyPeriodKey(GetUtcYearMonth());
        decimal warnAt = decimal.Round(
            opts.IncludedUsdPerUtcMonth * decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m),
            4,
            MidpointRounding.AwayFromZero);

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Monthly,
                        PeriodKey = periodKey,
                        ActualUsd = 0m,
                        ReleaseReservedUsd = pending.Value,
                        WarnAtUsd = warnAt,
                        ExpectedRowVersion = read.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (settled.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            PendingReservedAssumedUsd.Value = null;

            return;
        }

        throw new InvalidOperationException(
            "LLM monthly dollar budget reservation could not be released after optimistic retries.");
    }

    private static void TryScheduleWarnAudit(
        IScopeContextProvider scopeProvider,
        IAuditService auditService,
        int year,
        int month,
        decimal newTotal,
        decimal warnAt,
        LlmMonthlyTenantDollarBudgetOptions opts)
    {
        try
        {
            ScopeContext scope = scopeProvider.GetCurrentScope();
            string monthLabel = string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", year, month);
            string dataJson = JsonSerializer.Serialize(
                new
                {
                    utcMonth = monthLabel,
                    spentUsd = newTotal,
                    warnAtUsd = warnAt,
                    includedUsd = opts.IncludedUsdPerUtcMonth,
                    hardCutoffUsd = opts.HardCutoffUsdPerUtcMonth
                });

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching,
                "llm-monthly-dollar-budget",
                "llm-monthly-dollar-budget",
                dataJson);

            _ = auditService.LogAsync(auditEvent, CancellationToken.None).ContinueWith(
                static t => _ = t.Exception,
                CancellationToken.None,
                TaskContinuationOptions.OnlyOnFaulted,
                TaskScheduler.Default);
        }
        catch
        {
            // Never block completion path on audit scheduling.
        }
    }

    private static (int Year, int Month) GetUtcYearMonth()
    {
        DateTime utc = TimeProvider.System.UtcNowDateTime();

        return (utc.Year, utc.Month);
    }

    private static DateTimeOffset FirstInstantOfNextUtcMonth(int year, int month)
    {
        DateTime firstNext = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        return new DateTimeOffset(firstNext, TimeSpan.Zero);
    }

    private static string MonthlyPeriodKey((int Year, int Month) ym) =>
        string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", ym.Year, ym.Month);
}
