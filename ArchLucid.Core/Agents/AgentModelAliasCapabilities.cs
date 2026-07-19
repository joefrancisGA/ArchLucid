namespace ArchLucid.Core.Agents;

/// <summary>Capability tags advertised on model alias registry entries (TB-869).</summary>
public static class AgentModelAliasCapabilities
{
    public const string StructuredOutput = "structured-output";

    public const string LongContext = "long-context";

    public const string ToolUse = "tool-use";

    public const string AdvancedReasoning = "advanced-reasoning";
}
