using ArchLucid.Application.Tenancy;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Configuration;

public sealed class InsightDensityGateOptionsResolver(
    IOptions<InsightDensityGateOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor) : IInsightDensityGateOptionsResolver
{
    private readonly IOptions<InsightDensityGateOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor
        ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    public InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default)
    {
        InsightDensityGateOptions effective = Clone(_hostOptions.Value);
        bool isRealExecutionMode = InsightDensityGateEffectiveOptionsMerger.IsRealExecutionMode(
            _effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            InsightDensityGateEffectiveOptionsMerger.ApplyExecutionModePolicy(
                effective,
                isRealExecutionMode,
                llmJudgeOverridden: false,
                llmJudgeTenantValue: false,
                engineJudgeOverridden: false,
                engineJudgeTenantValue: false);

            return effective;
        }

        bool llmJudgeOverridden = TryReadTenantBoolean(
            scope.TenantId,
            TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled,
            cancellationToken,
            out bool llmJudgeTenantValue);

        if (llmJudgeOverridden)
        {
            effective.EnableLlmJudge = llmJudgeTenantValue;
        }

        bool engineJudgeOverridden = TryReadTenantBoolean(
            scope.TenantId,
            TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
            cancellationToken,
            out bool engineJudgeTenantValue);

        if (engineJudgeOverridden)
        {
            effective.EnableLlmJudgeForEngineFindings = engineJudgeTenantValue;
        }

        InsightDensityGateEffectiveOptionsMerger.ApplyExecutionModePolicy(
            effective,
            isRealExecutionMode,
            llmJudgeOverridden,
            llmJudgeTenantValue,
            engineJudgeOverridden,
            engineJudgeTenantValue);

        return effective;
    }

    private bool TryReadTenantBoolean(
        Guid tenantId,
        string settingKey,
        CancellationToken cancellationToken,
        out bool value)
    {
        string? stored = _tenantSettingsRepository
            .TryGetAsync(tenantId, settingKey, cancellationToken)
            .GetAwaiter()
            .GetResult();

        return TenantSettingBooleanParser.TryParse(stored, out value);
    }

    private static InsightDensityGateOptions Clone(InsightDensityGateOptions source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new InsightDensityGateOptions
        {
            DemotionThreshold = source.DemotionThreshold,
            HighDuplicationSimilarityThreshold = source.HighDuplicationSimilarityThreshold,
            ModerateDuplicationSimilarityThreshold = source.ModerateDuplicationSimilarityThreshold,
            EnableLlmJudge = source.EnableLlmJudge,
            MaxJudgedFindingsPerSnapshot = source.MaxJudgedFindingsPerSnapshot,
            EnableLlmJudgeForEngineFindings = source.EnableLlmJudgeForEngineFindings,
        };
    }
}
