namespace ArchLucid.AgentRuntime.Planning;

/// <summary>Shared LLM instructions and routing hints for pre-run draft intake reasoning (SAQ-013).</summary>
public static class DraftIntakeReasoningLlmPrompts
{
    /// <summary>
    ///     Substring matched by offline/simulator completion clients to return intake-reasoning-shaped JSON
    ///     instead of agent-run payloads.
    /// </summary>
    public const string SimulatorRoutingMarker = "[ARCHLUCID_DRAFT_INTAKE_REASON]";
}
