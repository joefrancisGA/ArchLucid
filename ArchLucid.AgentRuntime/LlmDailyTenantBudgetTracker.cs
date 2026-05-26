using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-day combined token totals per tenant for <see cref="LlmDailyTenantTokenWindowOptions" /> (warn once, hard
///     stop), backed by <see cref="ILlmTenantBudgetRepository" /> with pre-call reserve and post-call settle (INV-004).
/// </summary>
public sealed class LlmDailyTenantBudgetTracker(
    IOptionsMonitor<LlmDailyTenantTokenWindowOptions> optionsMonitor,
    ILlmTenantBudgetRepository budgetRepository)
{
    private const int MaxOptimisticRetries = 12;

    private static readonly AsyncLocal<long?> PendingReservedAssumedTokens = new();

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IOptionsMonitor<LlmDailyTenantTokenWindowOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <summary>Throws <see cref="LlmTokenQuotaExceededException" /> when the next call would exceed the UTC-day cap.</summary>
    public async Task<long?> EnsureWithinBudgetBeforeCallAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return null;

        LlmDailyTenantTokenWindowOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return null;

        int assumed = Math.Clamp(opts.AssumedMaxTotalTokensPerRequest, 1, 2_000_000);
        long max = opts.HardCutoffTokensPerUtcDay;
        DateOnly today = TimeProvider.System.UtcToday();
        string periodKey = DailyPeriodKey(today);

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Daily, periodKey, cancellationToken)
                .ConfigureAwait(false);

        if (state.TotalTokenPressure + assumed > max)
        {
            DateTimeOffset retryAfterUtc =
                new(TimeProvider.System.UtcNowDateTime().Date.AddDays(1), TimeSpan.Zero);

            throw new LlmTokenQuotaExceededException(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "LLM daily token budget exceeded for tenant (UTC day cap {0}, used ~{1}).",
                    max,
                    state.TotalTokenPressure),
                retryAfterUtc);
        }

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            state =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Daily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetReserveResult reserved = await _budgetRepository
                .ReserveAsync(
                    new LlmTenantBudgetReserveRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Daily,
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
                LlmTenantBudgetStateReadModel blocked = reserved.NewState ?? state;
                DateTimeOffset retryAfterUtc =
                    new(TimeProvider.System.UtcNowDateTime().Date.AddDays(1), TimeSpan.Zero);

                throw new LlmTokenQuotaExceededException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "LLM daily token budget exceeded for tenant (UTC day cap {0}, used ~{1}).",
                        max,
                        blocked.TotalTokenPressure),
                    retryAfterUtc);
            }

            return assumed;
        }

        throw new InvalidOperationException("LLM daily token budget reserve could not complete after optimistic retries.");
    }

    /// <summary>Accumulates usage and fires the once-per-UTC-day warning audit when crossing the warn threshold.</summary>
    public async Task RecordUsageAndMaybeWarnAsync(
        Guid tenantId,
        string providerKind,
        IScopeContextProvider scopeProvider,
        IAuditService? auditService,
        int promptTokens,
        int completionTokens,
        long? pendingReserved,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmDailyTenantTokenWindowOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        if (promptTokens < 1 && completionTokens < 1)
            return;

        long added = Math.Max(0, promptTokens) + (long)Math.Max(0, completionTokens);
        DateOnly today = TimeProvider.System.UtcToday();
        string periodKey = DailyPeriodKey(today);
        long max = opts.HardCutoffTokensPerUtcDay;
        long warnAt = (long)Math.Floor(max * (double)decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m));

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Daily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Daily,
                        PeriodKey = periodKey,
                        ActualTokens = added,
                        ReleaseReservedTokens = pendingReserved ?? 0L,
                        WarnAtTokens = warnAt,
                        ExpectedRowVersion = read.RowVersion
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (settled.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            long newTotal =
                settled.NewState?.TokensConsumed ?? throw new InvalidOperationException("Missing token state after update.");

            if (!settled.ShouldEmitWarnAudit || auditService is null)
                return;

            TryScheduleWarnAudit(scopeProvider, auditService, today, newTotal, warnAt, max);

            return;
        }

        throw new InvalidOperationException("LLM daily token budget could not be updated after optimistic retries.");
    }

    /// <summary>Releases a pre-call reservation when no completion usage was recorded (failed provider call).</summary>
    public async Task ReleasePendingReservationIfAnyAsync(
        Guid tenantId,
        string providerKind,
        long? pending,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmDailyTenantTokenWindowOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        if (pending is null or < 1)
            return;

        DateOnly today = TimeProvider.System.UtcToday();
        string periodKey = DailyPeriodKey(today);
        long max = opts.HardCutoffTokensPerUtcDay;
        long warnAt = (long)Math.Floor(max * (double)decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m));

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantBudgetStateReadModel read =
                await _budgetRepository.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Daily, periodKey, cancellationToken)
                    .ConfigureAwait(false);

            LlmTenantBudgetSettleResult settled = await _budgetRepository
                .SettleAsync(
                    new LlmTenantBudgetSettleRequest
                    {
                        TenantId = tenantId,
                        Period = LlmBudgetPeriod.Daily,
                        PeriodKey = periodKey,
                        ActualTokens = 0L,
                        ReleaseReservedTokens = pending.Value,
                        WarnAtTokens = warnAt,
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

        throw new InvalidOperationException("LLM daily token budget reservation could not be released after optimistic retries.");
    }

    private static string DailyPeriodKey(DateOnly utcDay) =>
        utcDay.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    [InformationalAudit]
    private static void TryScheduleWarnAudit(
        IScopeContextProvider scopeProvider,
        IAuditService auditService,
        DateOnly utcDay,
        long newTotal,
        long warnAt,
        long maxTotal)
    {
        try
        {
            ScopeContext scope = scopeProvider.GetCurrentScope();
            string dataJson = JsonSerializer.Serialize(
                new
                {
                    utcDay = utcDay.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    usedTotal = newTotal,
                    warnAt,
                    maxTotal
                });

            AuditEvent auditEvent = scope.CreateAuditEvent(
                AuditEventTypes.LlmTenantDailyBudgetApproaching,
                "llm-daily-budget",
                "llm-daily-budget",
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
}
