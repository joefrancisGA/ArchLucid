namespace ArchLucid.Core.Configuration;

/// <summary>
///     Production-like hosted-pilot minimums for <see cref="AgentOutputQualityGateMode.PilotStrict"/> posture.
///     Config lint blocks below these on production-like hosting; Staging/Production appsettings meet or exceed them.
/// </summary>
public static class QualityGatePilotStrictThresholdMinimums
{
    public const double MinSemanticRejectBelow = 0.55;

    public const double MinPilotStrictMinSemanticScore = 0.55;

    public const double MinPilotStrictMinFaithfulnessSupportRatio = 0.65;

    public const double MinCriticPerAgentSemanticRejectBelow = 0.55;
}
