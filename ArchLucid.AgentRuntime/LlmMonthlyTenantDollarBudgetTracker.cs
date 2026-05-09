using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     UTC-month estimated USD spend per tenant for <see cref="LlmMonthlyTenantDollarBudgetOptions" /> (warn once,
///     hard stop), backed by <see cref="ILlmMonthlyTenantBudgetStateRepository" /> for multi-replica correctness.
/// </summary>
public sealed class LlmMonthlyTenantDollarBudgetTracker(
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> optionsMonitor,
    ILlmCostEstimator costEstimator,
    ILlmMonthlyTenantBudgetStateRepository budgetStateRepository)
{
    private const int MaxOptimisticRetries = 12;

    private readonly ILlmMonthlyTenantBudgetStateRepository _budgetStateRepository =
        budgetStateRepository ?? throw new ArgumentNullException(nameof(budgetStateRepository));

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

        (int year, int month) = GetUtcYearMonth();

        LlmMonthlyTenantBudgetStateReadModel state =
            await _budgetStateRepository.GetOrCreateAsync(tenantId, year, month, cancellationToken).ConfigureAwait(false);

        if (state.SpentUsd + assumed <= opts.HardCutoffUsdPerUtcMonth)
            return;

        DateTimeOffset retryAfterUtc = FirstInstantOfNextUtcMonth(year, month);

        throw new LlmTokenQuotaExceededException(
            string.Format(
                CultureInfo.InvariantCulture,
                "LLM monthly dollar budget exceeded for tenant (UTC month hard cap {0:C}, used ~{1:C}).",
                opts.HardCutoffUsdPerUtcMonth,
                state.SpentUsd),
            retryAfterUtc);
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

        (int year, int month) = GetUtcYearMonth();

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmMonthlyTenantBudgetStateReadModel read =
                await _budgetStateRepository.GetOrCreateAsync(tenantId, year, month, cancellationToken).ConfigureAwait(false);

            LlmMonthlyTenantBudgetSpendUpdateResult updated = await _budgetStateRepository
                .TryIncrementSpendAsync(tenantId, year, month, addUsd.Value, warnAt, read.RowVersion, cancellationToken)
                .ConfigureAwait(false);

            if (updated.ConcurrencyConflict)
            {
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            decimal newTotal = updated.NewState?.SpentUsd ?? throw new InvalidOperationException("Missing spend state after update.");

            if (!updated.ShouldEmitWarnAudit || auditService is null)
                return;

            TryScheduleWarnAudit(scopeProvider, auditService, year, month, newTotal, warnAt, opts);

            return;
        }

        throw new InvalidOperationException("LLM monthly dollar budget could not be updated after optimistic retries.");
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
}
