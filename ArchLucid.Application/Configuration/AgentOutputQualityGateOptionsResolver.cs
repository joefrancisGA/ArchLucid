using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Configuration;

public sealed class AgentOutputQualityGateOptionsResolver(
    IOptions<AgentOutputQualityGateOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : IAgentOutputQualityGateOptionsResolver
{
    private readonly IOptions<AgentOutputQualityGateOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public AgentOutputQualityGateOptions Resolve(CancellationToken cancellationToken = default)
    {
        AgentOutputQualityGateOptions effective = Clone(_hostOptions.Value);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return effective;

        string? storedMode = _tenantSettingsRepository
            .TryGetAsync(scope.TenantId, TenantSettingKeys.AgentOutputQualityGateMode, cancellationToken)
            .GetAwaiter()
            .GetResult();

        if (TryParseMode(storedMode, out AgentOutputQualityGateMode mode))
            effective.Mode = mode;

        return effective;
    }

    internal static bool TryParseMode(string? raw, out AgentOutputQualityGateMode mode)
    {
        mode = AgentOutputQualityGateMode.WarnOnly;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        return Enum.TryParse(raw.Trim(), ignoreCase: true, out mode);
    }

    internal static string FormatMode(AgentOutputQualityGateMode mode) => mode.ToString();

    private static AgentOutputQualityGateOptions Clone(AgentOutputQualityGateOptions source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new AgentOutputQualityGateOptions
        {
            Mode = source.Mode,
            PilotStrictMinStructuralCompleteness = source.PilotStrictMinStructuralCompleteness,
            PilotStrictMinSemanticScore = source.PilotStrictMinSemanticScore,
            PilotStrictMinEvidenceRefCount = source.PilotStrictMinEvidenceRefCount,
            PilotStrictMinFaithfulnessSupportRatio = source.PilotStrictMinFaithfulnessSupportRatio,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = source.PilotStrictMinAgentResultFaithfulnessSupportRatio,
            HeuristicEvaluatorTightenedThresholds = source.HeuristicEvaluatorTightenedThresholds,
            Enabled = source.Enabled,
            StructuralWarnBelow = source.StructuralWarnBelow,
            SemanticWarnBelow = source.SemanticWarnBelow,
            StructuralRejectBelow = source.StructuralRejectBelow,
            SemanticRejectBelow = source.SemanticRejectBelow,
            PerAgentTypeFloors = new Dictionary<string, AgentTypeQualityFloors>(source.PerAgentTypeFloors, StringComparer.OrdinalIgnoreCase),
            EnforceOnReject = source.EnforceOnReject,
            BlockRunOnReject = source.BlockRunOnReject,
            PersistPartialOutputsOnBudgetExceeded = source.PersistPartialOutputsOnBudgetExceeded,
            MaxTokensPerRun = source.MaxTokensPerRun,
            MaxCostPerRun = source.MaxCostPerRun
        };
    }
}
