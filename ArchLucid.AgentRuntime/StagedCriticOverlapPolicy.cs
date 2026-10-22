using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Quality gate for staged Critic overlap — blocks overlap when PilotStrict enforce/block posture requires
///     the prior-agent summary in the Critic prompt.
/// </summary>
internal static class StagedCriticOverlapPolicy
{
    internal static bool ShouldUseOverlap(
        StagedCriticAgentOptions stagedOptions,
        AgentOutputQualityGateOptions qualityGateOptions)
    {
        ArgumentNullException.ThrowIfNull(stagedOptions);
        ArgumentNullException.ThrowIfNull(qualityGateOptions);

        stagedOptions.Normalize();

        if (!stagedOptions.StagedCriticEnabled || !stagedOptions.StagedCriticOverlapEnabled)
            return false;

        if (!qualityGateOptions.Enabled)
            return true;

        if (qualityGateOptions.Mode != AgentOutputQualityGateMode.PilotStrict)
            return true;

        if (qualityGateOptions.EnforceOnReject || qualityGateOptions.BlockRunOnReject)
            return false;

        return true;
    }

    internal static int ResolvePhase1MaxConcurrentHandlers(
        StagedCriticAgentOptions stagedOptions,
        int bulkheadMaxConcurrentHandlers)
    {
        ArgumentNullException.ThrowIfNull(stagedOptions);

        stagedOptions.Normalize();

        if (!stagedOptions.StagedCriticEnabled || !stagedOptions.StagedCriticOverlapEnabled)
            return 0;

        if (stagedOptions.Phase1MaxConcurrentHandlers > 0)
            return stagedOptions.Phase1MaxConcurrentHandlers;

        if (bulkheadMaxConcurrentHandlers <= 1)
            return 0;

        return bulkheadMaxConcurrentHandlers - 1;
    }
}
