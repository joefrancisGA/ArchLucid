using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-day combined token totals per tenant for <see cref="LlmDailyTenantTokenWindowOptions" /> (warn once, hard
///     stop), backed by <see cref="ILlmDailyTenantTokenWindowStateRepository" /> for multi-replica correctness.
/// </summary>
public sealed class LlmDailyTenantBudgetTracker(
    IOptionsMonitor<LlmDailyTenantTokenWindowOptions> optionsMonitor,
    ILlmDailyTenantTokenWindowStateRepository stateRepository)
{
    private const int MaxOptimisticRetries = 12;

    private readonly ILlmDailyTenantTokenWindowStateRepository _stateRepository =
        stateRepository ?? throw new ArgumentNullException(nameof(stateRepository));

    private readonly IOptionsMonitor<LlmDailyTenantTokenWindowOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <summary>Throws <see cref="LlmTokenQuotaExceededException" /> when the next call would exceed the UTC-day cap.</summary>
    public async Task EnsureWithinBudgetBeforeCallAsync(
        Guid tenantId,
        string providerKind,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || providerKind.IsExcludedFromBudgetTracking())
            return;

        LlmDailyTenantTokenWindowOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        DateOnly today = TimeProvider.System.UtcToday();
        int assumed = Math.Clamp(opts.AssumedMaxTotalTokensPerRequest, 1, 2_000_000);
        long max = opts.HardCutoffTokensPerUtcDay;

        LlmDailyTenantTokenWindowStateReadModel state =
            await _stateRepository.GetOrCreateAsync(tenantId, today, cancellationToken).ConfigureAwait(false);

        if (state.TotalTokens + assumed <= max)
            return;

        DateTimeOffset retryAfterUtc =
            new(TimeProvider.System.UtcNowDateTime().Date.AddDays(1), TimeSpan.Zero);

        throw new LlmTokenQuotaExceededException(
            string.Format(
                CultureInfo.InvariantCulture,
                "LLM daily token budget exceeded for tenant (UTC day cap {0}, used ~{1}).",
                max,
                state.TotalTokens),
            retryAfterUtc);
    }

    /// <summary>Accumulates usage and fires the once-per-UTC-day warning audit when crossing the warn threshold.</summary>
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

        LlmDailyTenantTokenWindowOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffTokensPerUtcDay < 1)
            return;

        if (promptTokens < 1 && completionTokens < 1)
            return;

        long added = Math.Max(0, promptTokens) + (long)Math.Max(0, completionTokens);
        DateOnly today = TimeProvider.System.UtcToday();
        long max = opts.HardCutoffTokensPerUtcDay;
        long warnAt = (long)Math.Floor(max * (double)decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m));

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmDailyTenantTokenWindowStateReadModel read =
                await _stateRepository.GetOrCreateAsync(tenantId, today, cancellationToken).ConfigureAwait(false);

            LlmDailyTenantTokenWindowTokensUpdateResult updated = await _stateRepository
                .TryIncrementTokensAsync(tenantId, today, added, warnAt, read.RowVersion, cancellationToken)
                .ConfigureAwait(false);

            if (updated.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            long newTotal =
                updated.NewState?.TotalTokens ?? throw new InvalidOperationException("Missing token state after update.");

            if (!updated.ShouldEmitWarnAudit || auditService is null)
                return;

            TryScheduleWarnAudit(scopeProvider, auditService, today, newTotal, warnAt, max);

            return;
        }

        throw new InvalidOperationException("LLM daily token budget could not be updated after optimistic retries.");
    }

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
