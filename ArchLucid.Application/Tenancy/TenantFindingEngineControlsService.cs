using ArchLucid.Application.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tenancy;

public sealed class TenantFindingEngineControlsService(
    IOptions<InsightDensityGateOptions> insightDensityHostOptions,
    IOptions<PortfolioRecurrenceFindingOptions> portfolioRecurrenceHostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : ITenantFindingEngineControlsService
{
    private readonly IOptions<InsightDensityGateOptions> _insightDensityHostOptions =
        insightDensityHostOptions ?? throw new ArgumentNullException(nameof(insightDensityHostOptions));

    private readonly IOptions<PortfolioRecurrenceFindingOptions> _portfolioRecurrenceHostOptions =
        portfolioRecurrenceHostOptions ?? throw new ArgumentNullException(nameof(portfolioRecurrenceHostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public async Task<TenantFindingEngineControlsSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();
        InsightDensityGateOptions hostInsightDensity = _insightDensityHostOptions.Value;
        PortfolioRecurrenceFindingOptions hostPortfolio = _portfolioRecurrenceHostOptions.Value;

        string? llmJudgeStored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled, cancellationToken)
            .ConfigureAwait(false);

        string? engineJudgeStored = await _tenantSettingsRepository
            .TryGetAsync(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
                cancellationToken)
            .ConfigureAwait(false);

        string? portfolioStored = await _tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.FindingsPortfolioRecurrenceEnabled, cancellationToken)
            .ConfigureAwait(false);

        bool llmJudgeOverridden = TenantSettingBooleanParser.TryParse(llmJudgeStored, out bool effectiveLlmJudge);
        bool engineJudgeOverridden =
            TenantSettingBooleanParser.TryParse(engineJudgeStored, out bool effectiveEngineJudge);

        bool portfolioOverridden = TenantSettingBooleanParser.TryParse(portfolioStored, out bool effectivePortfolio);

        return new TenantFindingEngineControlsSnapshot(
            llmJudgeOverridden ? effectiveLlmJudge : hostInsightDensity.EnableLlmJudge,
            engineJudgeOverridden ? effectiveEngineJudge : hostInsightDensity.EnableLlmJudgeForEngineFindings,
            portfolioOverridden ? effectivePortfolio : hostPortfolio.Enabled,
            hostInsightDensity.EnableLlmJudge,
            hostInsightDensity.EnableLlmJudgeForEngineFindings,
            hostPortfolio.Enabled,
            llmJudgeOverridden,
            engineJudgeOverridden,
            portfolioOverridden);
    }

    public async Task<TenantFindingEngineControlsSnapshot> SetAsync(
        bool enableLlmJudge,
        bool enableLlmJudgeForEngineFindings,
        bool portfolioRecurrenceEnabled,
        CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled,
                TenantSettingBooleanParser.Format(enableLlmJudge),
                cancellationToken)
            .ConfigureAwait(false);

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
                TenantSettingBooleanParser.Format(enableLlmJudgeForEngineFindings),
                cancellationToken)
            .ConfigureAwait(false);

        await _tenantSettingsRepository
            .UpsertAsync(
                tenantId,
                TenantSettingKeys.FindingsPortfolioRecurrenceEnabled,
                TenantSettingBooleanParser.Format(portfolioRecurrenceEnabled),
                cancellationToken)
            .ConfigureAwait(false);

        return await GetAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<TenantFindingEngineControlsSnapshot> ClearOverridesAsync(CancellationToken cancellationToken)
    {
        Guid tenantId = RequireTenantId();

        await _tenantSettingsRepository
            .DeleteAsync(tenantId, TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled, cancellationToken)
            .ConfigureAwait(false);

        await _tenantSettingsRepository
            .DeleteAsync(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
                cancellationToken)
            .ConfigureAwait(false);

        await _tenantSettingsRepository
            .DeleteAsync(tenantId, TenantSettingKeys.FindingsPortfolioRecurrenceEnabled, cancellationToken)
            .ConfigureAwait(false);

        return await GetAsync(cancellationToken).ConfigureAwait(false);
    }

    private Guid RequireTenantId()
    {
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
        {
            throw new InvalidOperationException("Tenant scope is required.");
        }

        return tenantId;
    }
}
