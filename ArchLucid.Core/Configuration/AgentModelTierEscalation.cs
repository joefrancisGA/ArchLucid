using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Escalates LLM model tiers on quality-gate auto-retry (TB-682): Economy → Standard → Premium.
/// </summary>
public static class AgentModelTierEscalation
{
    /// <summary>Returns the next tier for auto-retry; Premium stays Premium.</summary>
    public static LlmModelTier Escalate(LlmModelTier currentTier)
    {
        if (currentTier == LlmModelTier.Economy)
            return LlmModelTier.Standard;

        if (currentTier == LlmModelTier.Standard)
            return LlmModelTier.Premium;

        return LlmModelTier.Premium;
    }

    /// <summary>True when <see cref="Escalate" /> would change the tier.</summary>
    public static bool CanEscalate(LlmModelTier currentTier) => currentTier != LlmModelTier.Premium;
}
