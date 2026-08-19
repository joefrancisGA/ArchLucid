using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class TenantAiBudgetPolicyResolver(
    ITenantRepository tenantRepository,
    ITenantAiBudgetPolicyRepository policyRepository,
    ILlmTenantBudgetRepository budgetRepository,
    ITenantAzureOpenAiConnectionRepository azureOpenAiConnectionRepository,
    IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyBudgetOptions,
    IConfiguration configuration,
    TimeProvider timeProvider) : ITenantAiBudgetPolicyResolver
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantAiBudgetPolicyRepository _policyRepository =
        policyRepository ?? throw new ArgumentNullException(nameof(policyRepository));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly ITenantAzureOpenAiConnectionRepository _azureOpenAiConnectionRepository =
        azureOpenAiConnectionRepository ?? throw new ArgumentNullException(nameof(azureOpenAiConnectionRepository));

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _monthlyBudgetOptions =
        monthlyBudgetOptions ?? throw new ArgumentNullException(nameof(monthlyBudgetOptions));

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<TenantAiBudgetPolicySnapshot> ResolveAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
        {
            return InactiveSnapshot();
        }

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
        {
            return InactiveSnapshot();
        }

        TenantAiBudgetPolicyRow? overrideRow =
            await _policyRepository.GetByTenantIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        AiUsageWorkspaceKind workspaceKind = ResolveWorkspaceKind(tenant);
        AiUsageControlsOptions controls = _aiUsageOptions.CurrentValue;
        LlmMonthlyTenantDollarBudgetOptions monthlyOpts = _monthlyBudgetOptions.CurrentValue;
        decimal budgetAmount = ResolveBudgetAmountUsd(workspaceKind, controls, monthlyOpts, overrideRow);
        string periodKey = _timeProvider.GetUtcNow().UtcDateTime.ToString("yyyy-MM");

        LlmTenantBudgetStateReadModel state =
            await _budgetRepository
                .GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, cancellationToken)
                .ConfigureAwait(false);

        decimal used = state.TotalUsdPressure;
        decimal remaining = Math.Max(0m, budgetAmount + state.PurchasedCapBumpUsd - used);
        bool walletAllowed = workspaceKind == AiUsageWorkspaceKind.Paid && monthlyOpts.Enabled;

        TenantAzureOpenAiConnectionRecord? byoConnection =
            await _azureOpenAiConnectionRepository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        bool customerProvider = controls.AllowCustomerAiProvider && byoConnection is { IsEnabled: true };
        bool hardStop = overrideRow?.HardStopEnabled ?? controls.HardStopEnabled;
        bool blocks = hardStop && used >= budgetAmount + state.PurchasedCapBumpUsd;

        return new TenantAiBudgetPolicySnapshot
        {
            WorkspaceKind = workspaceKind,
            BudgetAmountUsd = budgetAmount,
            UsedAmountUsd = used,
            RemainingAmountUsd = remaining,
            HardStopEnabled = hardStop,
            TrialExpirationUtc = overrideRow?.TrialExpirationUtc ?? tenant.TrialExpiresUtc,
            WalletOverageAllowed = walletAllowed,
            CustomerAiProviderConfigured = customerProvider,
            BlocksAdditionalLlmExecution = blocks && !customerProvider,
        };
    }

    public async Task<AiUsageWorkspaceKind> ResolveWorkspaceKindAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
        {
            return AiUsageWorkspaceKind.Paid;
        }

        return ResolveWorkspaceKind(tenant);
    }

    private AiUsageWorkspaceKind ResolveWorkspaceKind(TenantRecord tenant)
    {
        AiUsageControlsOptions controls = _aiUsageOptions.CurrentValue;
        bool demoHost = controls.DemoMode || _configuration.GetValue<bool>("Demo:Enabled");

        if (demoHost && controls.PublicDemoTenantSlugs.Contains(tenant.Slug, StringComparer.OrdinalIgnoreCase))
        {
            return AiUsageWorkspaceKind.PublicDemo;
        }

        if (controls.TrialMode &&
            string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
        {
            return AiUsageWorkspaceKind.Trial;
        }

        return AiUsageWorkspaceKind.Paid;
    }

    private static decimal ResolveBudgetAmountUsd(
        AiUsageWorkspaceKind workspaceKind,
        AiUsageControlsOptions controls,
        LlmMonthlyTenantDollarBudgetOptions monthlyOpts,
        TenantAiBudgetPolicyRow? overrideRow)
    {
        if (overrideRow?.BudgetAmountUsd is { } overrideBudget && overrideBudget > 0m)
        {
            return overrideBudget;
        }

        return workspaceKind switch
        {
            AiUsageWorkspaceKind.PublicDemo => controls.PublicDemoMonthlyAiBudgetUsd,
            AiUsageWorkspaceKind.Trial => controls.DefaultTrialAiBudgetUsd,
            _ => monthlyOpts.HardCutoffUsdPerUtcMonth,
        };
    }

    private static TenantAiBudgetPolicySnapshot InactiveSnapshot() =>
        new()
        {
            WorkspaceKind = AiUsageWorkspaceKind.Paid,
            HardStopEnabled = false,
            BlocksAdditionalLlmExecution = false,
        };
}
