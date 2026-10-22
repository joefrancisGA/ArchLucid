namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>Parses architecture run identifiers used for stable prompt variant bucketing.</summary>
public static class AgentRunIdParser
{
    public static bool TryParse(string runId, out Guid runGuid)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
