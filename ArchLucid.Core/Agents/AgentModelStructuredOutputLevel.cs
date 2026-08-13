namespace ArchLucid.Core.Agents;

/// <summary>Structured-output capability ladder per catalog row (TB-2104 / ADR 0065 D4).</summary>
public enum AgentModelStructuredOutputLevel
{
    DegradedTextParse = 0,
    JsonObject = 1,
    StrictJsonSchema = 2,
}
