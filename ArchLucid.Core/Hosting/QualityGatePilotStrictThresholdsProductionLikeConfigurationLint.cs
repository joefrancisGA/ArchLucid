using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Flags production-like hosts running PilotStrict with semantic/faithfulness floors below hosted-pilot minimums.
/// </summary>
public static class QualityGatePilotStrictThresholdsProductionLikeConfigurationLint
{
    private const double Epsilon = 0.0001;

    /// <summary>
    ///     Returns an advisory finding when production-like hosting runs PilotStrict below hosted-pilot minimums.
    /// </summary>
    public static HostingMisconfigurationWarning? TryDescribeAdvisoryFinding(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        if (!ShouldEmitFinding(configuration, aspNetCoreEnvironmentName.Trim()))
            return null;

        return new HostingMisconfigurationWarning(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGatePilotStrictThresholdsTooLooseInProductionLike,
            "ArchLucid:AgentOutput:QualityGate is PilotStrict on production-like hosting but semantic or faithfulness "
            + "thresholds are below hosted-pilot minimums (see QualityGatePilotStrictThresholdMinimums). "
            + "Raise SemanticRejectBelow, PilotStrictMinSemanticScore, PilotStrictMinFaithfulnessSupportRatio, "
            + "and Critic per-agent semantic floors; keep EnforceOnReject and BlockRunOnReject enabled.");
    }

    internal static bool ShouldEmitFinding(IConfiguration configuration, string aspNetCoreEnvironmentName)
    {
        if (!ProductionLikeHostingMisconfigurationAdvisor.IsProductionLikeHosting(
                aspNetCoreEnvironmentName,
                configuration))
            return false;

        AgentOutputQualityGateOptions options =
            configuration.GetSection(AgentOutputQualityGateOptions.SectionPath).Get<AgentOutputQualityGateOptions>()
            ?? new AgentOutputQualityGateOptions();

        if (!options.Enabled)
            return false;

        if (options.Mode != AgentOutputQualityGateMode.PilotStrict)
            return false;

        if (!options.EnforceOnReject || !options.BlockRunOnReject)
            return true;

        if (options.SemanticRejectBelow + Epsilon < QualityGatePilotStrictThresholdMinimums.MinSemanticRejectBelow)
            return true;

        if (options.PilotStrictMinSemanticScore + Epsilon
            < QualityGatePilotStrictThresholdMinimums.MinPilotStrictMinSemanticScore)
            return true;

        if (!options.PilotStrictMinFaithfulnessSupportRatio.HasValue
            || options.PilotStrictMinFaithfulnessSupportRatio.Value + Epsilon
            < QualityGatePilotStrictThresholdMinimums.MinPilotStrictMinFaithfulnessSupportRatio)
            return true;

        if (options.PerAgentTypeFloors.TryGetValue("Critic", out AgentTypeQualityFloors? criticFloors)
            && criticFloors.SemanticRejectBelow + Epsilon
            < QualityGatePilotStrictThresholdMinimums.MinCriticPerAgentSemanticRejectBelow)
            return true;

        return false;
    }
}
