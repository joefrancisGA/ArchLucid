using System.Globalization;

using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Budgeting;

/// <inheritdoc cref="ILlmMonthlyTenantDollarBudgetStatusService" />
public sealed class LlmMonthlyTenantDollarBudgetStatusService(
    TimeProvider timeProvider,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> optionsMonitor,
    ILlmCostEstimator costEstimator,
    ILlmTenantBudgetRepository budgetRepository,
    IScopeContextProvider scopeContextProvider,
    ITenantAiBudgetPolicyResolver aiBudgetPolicyResolver) : ILlmMonthlyTenantDollarBudgetStatusService
{
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantAiBudgetPolicyResolver _aiBudgetPolicyResolver =
        aiBudgetPolicyResolver ?? throw new ArgumentNullException(nameof(aiBudgetPolicyResolver));

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantDollarBudgetStatusResult> GetStatusAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        DateTime utc = _timeProvider.GetUtcNow().UtcDateTime;
        string utcMonth = FormatUtcMonthKey(utc);

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
        {
            return InactiveResult(utcMonth);
        }

        TenantAiBudgetPolicySnapshot policy =
            await _aiBudgetPolicyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        LlmMonthlyTenantDollarBudgetOptions opts = _optionsMonitor.CurrentValue;

        if (policy.WorkspaceKind is AiUsageWorkspaceKind.Trial or AiUsageWorkspaceKind.PublicDemo)
        {
            return BuildWorkspacePolicyStatus(utcMonth, policy, opts);
        }

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
        {
            return InactiveResult(utcMonth);
        }

        int assumedPrompt = Math.Clamp(opts.AssumedMaxPromptTokensPerRequest, 1, 1_000_000);
        int assumedCompletion = Math.Clamp(opts.AssumedMaxCompletionTokensPerRequest, 1, 262_144);
        decimal? assumedUsdNullable = _costEstimator.EstimateUsd(assumedPrompt, assumedCompletion);
        decimal assumedUsd = assumedUsdNullable ?? 0m;

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository
                .GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, utcMonth, cancellationToken)
                .ConfigureAwait(false);

        decimal effectiveMax = opts.HardCutoffUsdPerUtcMonth + state.PurchasedCapBumpUsd;
        decimal pressure = state.TotalUsdPressure;
        decimal warnFraction = decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m);
        double utilizationFraction = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(
            pressure,
            opts.HardCutoffUsdPerUtcMonth,
            state.PurchasedCapBumpUsd);

        if (assumedUsd <= 0m)
        {
            return new LlmMonthlyTenantDollarBudgetStatusResult
            {
                MonthlyBudgetMonitoringActive = true,
                BlocksAdditionalLlmExecution = false,
                UtcMonth = utcMonth,
                HardCutoffUsdPerUtcMonth = opts.HardCutoffUsdPerUtcMonth,
                EffectiveHardCapUsd = effectiveMax,
                PurchasedCapBumpUsd = state.PurchasedCapBumpUsd,
                EstimatedUsdPressure = pressure,
                AssumedNextCallReservationUsd = null,
                HardCapUtilizationFraction = utilizationFraction,
                WarnFraction = warnFraction,
                RemainingBudgetUsd = policy.RemainingAmountUsd,
                WorkspaceKind = policy.WorkspaceKind.ToString(),
                CustomerAiProviderConfigured = policy.CustomerAiProviderConfigured,
            };
        }

        bool blocks = pressure + assumedUsd > effectiveMax;

        if (policy.HardStopEnabled)
        {
            blocks = policy.BlocksAdditionalLlmExecution || blocks;
            effectiveMax = policy.BudgetAmountUsd + state.PurchasedCapBumpUsd;
        }

        return new LlmMonthlyTenantDollarBudgetStatusResult
        {
            MonthlyBudgetMonitoringActive = true,
            BlocksAdditionalLlmExecution = blocks,
            UtcMonth = utcMonth,
            HardCutoffUsdPerUtcMonth = policy.BudgetAmountUsd > 0m ? policy.BudgetAmountUsd : opts.HardCutoffUsdPerUtcMonth,
            EffectiveHardCapUsd = effectiveMax,
            PurchasedCapBumpUsd = state.PurchasedCapBumpUsd,
            EstimatedUsdPressure = pressure,
            AssumedNextCallReservationUsd = assumedUsd,
            HardCapUtilizationFraction = utilizationFraction,
            WarnFraction = warnFraction,
            RemainingBudgetUsd = policy.RemainingAmountUsd,
            WorkspaceKind = policy.WorkspaceKind.ToString(),
            CustomerAiProviderConfigured = policy.CustomerAiProviderConfigured,
        };
    }

    private static LlmMonthlyTenantDollarBudgetStatusResult BuildWorkspacePolicyStatus(
        string utcMonth,
        TenantAiBudgetPolicySnapshot policy,
        LlmMonthlyTenantDollarBudgetOptions opts)
    {
        decimal effectiveMax = policy.BudgetAmountUsd;
        decimal pressure = policy.UsedAmountUsd;
        decimal warnFraction = decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m);
        double utilizationFraction = effectiveMax > 0m ? (double)(pressure / effectiveMax) : 0d;

        return new LlmMonthlyTenantDollarBudgetStatusResult
        {
            MonthlyBudgetMonitoringActive = true,
            BlocksAdditionalLlmExecution = policy.BlocksAdditionalLlmExecution,
            UtcMonth = utcMonth,
            HardCutoffUsdPerUtcMonth = policy.BudgetAmountUsd,
            EffectiveHardCapUsd = effectiveMax,
            PurchasedCapBumpUsd = 0m,
            EstimatedUsdPressure = pressure,
            AssumedNextCallReservationUsd = null,
            HardCapUtilizationFraction = utilizationFraction,
            WarnFraction = warnFraction,
            RemainingBudgetUsd = policy.RemainingAmountUsd,
            WorkspaceKind = policy.WorkspaceKind.ToString(),
            CustomerAiProviderConfigured = policy.CustomerAiProviderConfigured,
        };
    }

    private static LlmMonthlyTenantDollarBudgetStatusResult InactiveResult(string utcMonth) =>
        new()
        {
            MonthlyBudgetMonitoringActive = false,
            BlocksAdditionalLlmExecution = false,
            UtcMonth = utcMonth,
            HardCutoffUsdPerUtcMonth = null,
            EffectiveHardCapUsd = null,
            PurchasedCapBumpUsd = null,
            EstimatedUsdPressure = null,
            AssumedNextCallReservationUsd = null,
            HardCapUtilizationFraction = null,
            WarnFraction = null,
        };

    private static string FormatUtcMonthKey(DateTime utc) =>
        string.Format(CultureInfo.InvariantCulture, "{0:0000}-{1:00}", utc.Year, utc.Month);
}
