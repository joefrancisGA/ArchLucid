namespace ArchLucid.AgentRuntime.Tests;

public sealed class AgentExecutionResilienceOptionsTests
{
    [Fact]

    public void ResolveTimeoutSecondsForAgent_ReturnsZero_WhenGlobalTimeoutDisabled()
    {
        AgentExecutionResilienceOptions o =
            new()
            {
                PerHandlerTimeoutSeconds = 0,
                PerAgentTimeoutSeconds = new()
                {
                    ["topology"] = 120
                }
            };

        Assert.Equal(0, o.ResolveTimeoutSecondsForAgent("topology"));

    }

    [Fact]

    public void ResolveTimeoutSecondsForAgent_OverridesDispatchKey()
    {

        AgentExecutionResilienceOptions o = new()
        {
            PerHandlerTimeoutSeconds = 900,
            PerAgentTimeoutSeconds =
                new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase) { ["topology"] = 60 }
        };


        Assert.Equal(60, o.ResolveTimeoutSecondsForAgent("topology"));

        Assert.Equal(900, o.ResolveTimeoutSecondsForAgent("other"));

    }

    [Fact]

    public void ResolveTimeoutSecondsForAgent_FallsBack_WhenOverrideIsZero()
    {


        AgentExecutionResilienceOptions o = new()
        {
            PerHandlerTimeoutSeconds = 900,
            PerAgentTimeoutSeconds =
                new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase) { ["topology"] = 0 }
        };


        Assert.Equal(900, o.ResolveTimeoutSecondsForAgent("topology"));

    }

}
