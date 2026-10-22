using ArchLucid.Contracts.Agents;

namespace ArchLucid.Cli.Commands;

internal static class CitationIntegrityAgentResultParser
{
    internal static List<AgentResult> Parse(IReadOnlyList<object> rawResults)
    {
        ArgumentNullException.ThrowIfNull(rawResults);

        List<AgentResult> parsed = new();

        foreach (object raw in rawResults)
        {
            string json = System.Text.Json.JsonSerializer.Serialize(raw, CliCommandShared.JsonWriteIndented);
            AgentResult? result = System.Text.Json.JsonSerializer.Deserialize<AgentResult>(
                json,
                CliCommandShared.JsonDeserializeAgentResult);

            if (result is not null)
                parsed.Add(result);
        }

        return parsed;
    }
}
