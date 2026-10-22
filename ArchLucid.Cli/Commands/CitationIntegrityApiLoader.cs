using System.Net;
using System.Text.Json;

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

        try
        {
            using HttpResponseMessage response = await http.GetAsync($"/v1/architecture/review/{runId}", cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
                return null;

            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            using JsonDocument doc = JsonDocument.Parse(body);
            JsonElement root = doc.RootElement;

            if (!root.TryGetProperty("run", out JsonElement run) || run.ValueKind != JsonValueKind.Object)
                return null;

            ArchitectureRunStatus status = ParseRunStatus(run);
            List<object> rawResults = [];

            if (root.TryGetProperty("results", out JsonElement results) && results.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement result in results.EnumerateArray())
                {
                    object? raw = JsonSerializer.Deserialize<object>(result.GetRawText());

                    if (raw is not null)
                        rawResults.Add(raw);
                }
            }

            return new CitationIntegrityRunBundle
            {
                RunId = runId,
                Status = status,
                AgentResults = CitationIntegrityAgentResultParser.Parse(rawResults),
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return null;
        }
    }

    private static ArchitectureRunStatus ParseRunStatus(JsonElement run)
    {
        if (!run.TryGetProperty("status", out JsonElement statusEl))
            return default;

        if (statusEl.ValueKind == JsonValueKind.String)
        {
            string? statusRaw = statusEl.GetString();

            if (!string.IsNullOrWhiteSpace(statusRaw)
                && Enum.TryParse(statusRaw, ignoreCase: true, out ArchitectureRunStatus parsed))
            {
                return parsed;
            }

            return default;
        }

        if (statusEl.ValueKind == JsonValueKind.Number && statusEl.TryGetInt32(out int numericStatus))
            return (ArchitectureRunStatus)numericStatus;

        return default;
    }
}

