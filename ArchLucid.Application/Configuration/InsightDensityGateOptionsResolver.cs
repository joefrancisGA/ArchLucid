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
                InsightDensityTenantFlagOverrides.None);

            return effective;
        }

        InsightDensityGateEffectiveOptionsMerger.ApplyExecutionModePolicy(
            effective,
            isRealExecutionMode,
            ReadTenantFlagOverrides(scope.TenantId, cancellationToken));

        return effective;
    }

    private InsightDensityTenantFlagOverrides ReadTenantFlagOverrides(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        return new InsightDensityTenantFlagOverrides
        {
            LlmJudge = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled,
                cancellationToken),
            LlmJudgeForEngineFindings = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
                cancellationToken),
            InsightGenerator = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityInsightGeneratorEnabled,
                cancellationToken),
            PreferHighNoveltyEngines = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityPreferHighNoveltyEnginesEnabled,
                cancellationToken),
            PreferHighVerificationEngines = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityPreferHighVerificationEnginesEnabled,
                cancellationToken),
            ProseAssumptionExtraction = ReadTenantFlagOverride(
                tenantId,
                TenantSettingKeys.FindingsInsightDensityProseAssumptionExtractionEnabled,
                cancellationToken),
        };
    }

    private InsightDensityTenantFlagOverride ReadTenantFlagOverride(
        Guid tenantId,
        string settingKey,
        CancellationToken cancellationToken)
    {
        bool isOverridden = TryReadTenantBoolean(tenantId, settingKey, cancellationToken, out bool value);

        return isOverridden
            ? new InsightDensityTenantFlagOverride(IsOverridden: true, Value: value)
            : InsightDensityTenantFlagOverride.Absent;
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
            EnableInsightGenerator = source.EnableInsightGenerator,
            MaxGeneratedInsightFindingsPerSnapshot = source.MaxGeneratedInsightFindingsPerSnapshot,
            PreferHighNoveltyEngines = source.PreferHighNoveltyEngines,
            NoveltyRateWindowDays = source.NoveltyRateWindowDays,
            EnableProseAssumptionExtraction = source.EnableProseAssumptionExtraction,
            MaxProseAssumptionCandidatesPerSnapshot = source.MaxProseAssumptionCandidatesPerSnapshot,
            MaxProseAssumptionFindingsPerSnapshot = source.MaxProseAssumptionFindingsPerSnapshot,
            PreferHighVerificationEngines = source.PreferHighVerificationEngines,
            VerificationPriorMinSample = source.VerificationPriorMinSample,
            VerificationPriorWindowDays = source.VerificationPriorWindowDays,
        };
    }
}
