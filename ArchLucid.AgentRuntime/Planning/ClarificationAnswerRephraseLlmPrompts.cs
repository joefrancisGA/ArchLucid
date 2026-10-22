namespace ArchLucid.AgentRuntime.Planning;

/// <summary>Shared LLM instructions and routing hints for clarification answer rephrase.</summary>
public static class ClarificationAnswerRephraseLlmPrompts
{
    /// <summary>
    ///     Substring matched by offline/simulator completion clients to return clarification-rephrase-shaped JSON
    ///     instead of agent-run payloads.
    /// </summary>
    public const string SimulatorRoutingMarker = "rephrasedAnswer (string)";
}
