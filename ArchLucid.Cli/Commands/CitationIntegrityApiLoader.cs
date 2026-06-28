using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal static class CitationIntegrityApiLoader
{
    internal static async Task<CitationIntegrityRunBundle?> TryLoadRunBundleAsync(
        HttpClient http,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchLucidApiClient apiClient = new(http);
        ArchLucidApiClient.GetRunResult? run = await apiClient.GetRunAsync(runId, cancellationToken);

        if (run is null)
            return null;

        return new CitationIntegrityRunBundle
        {
            RunId = runId,
            Status = run.Run.Status,
            AgentResults = CitationIntegrityAgentResultParser.Parse(run.Results),
        };
    }
}

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
