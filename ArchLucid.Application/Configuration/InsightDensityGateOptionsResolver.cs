using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Configuration;

public sealed class InsightDensityGateOptionsResolver(
    IOptions<InsightDensityGateOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : IInsightDensityGateOptionsResolver
{
    private readonly IOptions<InsightDensityGateOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default)
    {
        InsightDensityGateOptions effective = Clone(_hostOptions.Value);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            return effective;
        }

        string? llmJudge = _tenantSettingsRepository
            .TryGetAsync(scope.TenantId, TenantSettingKeys.FindingsInsightDensityLlmJudgeEnabled, cancellationToken)
            .GetAwaiter()
            .GetResult();

        if (TenantSettingBooleanParser.TryParse(llmJudge, out bool enableLlmJudge))
        {
            effective.EnableLlmJudge = enableLlmJudge;
        }

        string? engineJudge = _tenantSettingsRepository
            .TryGetAsync(
                scope.TenantId,
                TenantSettingKeys.FindingsInsightDensityLlmJudgeEngineFindingsEnabled,
                cancellationToken)
            .GetAwaiter()
            .GetResult();

        if (TenantSettingBooleanParser.TryParse(engineJudge, out bool enableEngineJudge))
        {
            effective.EnableLlmJudgeForEngineFindings = enableEngineJudge;
        }

        return effective;
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
