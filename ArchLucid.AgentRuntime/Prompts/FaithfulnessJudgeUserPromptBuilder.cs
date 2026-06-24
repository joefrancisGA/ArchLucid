using System.Globalization;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>Builds the user prompt for the LLM faithfulness judge from trace context and payloads.</summary>
public static class FaithfulnessJudgeUserPromptBuilder
{
    public static string Build(string traceId, string evidenceText, string agentJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);
        ArgumentNullException.ThrowIfNull(evidenceText);
        ArgumentNullException.ThrowIfNull(agentJson);

        return string.Create(
            CultureInfo.InvariantCulture,
            $"traceId:{traceId}\n\nevidence:\n{evidenceText}\n\nagentJson:\n{agentJson}");
    }
}
