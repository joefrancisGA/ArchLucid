namespace ArchLucid.AgentRuntime.Tests;

/// <summary>Wraps a stub completion client in a pass-through tier router for handler unit tests.</summary>
public static class AgentTierCompletionRouterTestFactory
{
    public static PassThroughAgentTierCompletionRouter CreatePassThrough(IAgentCompletionClient inner) =>
        new(
            inner,
            new TieredAgentCompletionRouterTests.FixedAgentModelTierResolver());
}
