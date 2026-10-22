namespace ArchLucid.AgentRuntime.Planning;

/// <summary>Shared LLM instructions and routing hints for architecture overview rewrite.</summary>
public static class ArchitectureOverviewRewriteLlmPrompts
{
    /// <summary>
    ///     Substring matched by offline/simulator completion clients to return overview-rewrite-shaped JSON
    ///     instead of agent-run payloads.
    /// </summary>
    public const string SimulatorRoutingMarker = "rewrittenOverview (string)";
}
