namespace ArchLucid.AgentRuntime;

/// <summary>
///     Routing marker for offline/simulator <see cref="IAgentCompletionClient" /> implementations so policy-pack
///     explain prompts return Markdown instead of topology JSON.
/// </summary>
public static class PolicyPackExplainLlmPrompts
{
    /// <summary>Substring embedded in the system prompt — matched by <c>FakeAgentCompletionClient</c> wiring.</summary>
    public const string SimulatorRoutingMarker = "[ARCHLUCID_POLICY_PACK_JSON_EXPLAIN]";
}
