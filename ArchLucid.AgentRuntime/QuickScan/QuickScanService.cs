using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime.QuickScan;

/// <inheritdoc cref="IQuickScanService" />
public sealed class QuickScanService(IAgentCompletionClient completionClient) : IQuickScanService
{
    public async Task<QuickScanResult> ScanAsync(IReadOnlyDictionary<string, string> files, CancellationToken cancellationToken = default)
    {
        if (files is null)
            throw new ArgumentNullException(nameof(files));

        if (completionClient is null)
            throw new ArgumentNullException(nameof(completionClient));

        string userPrompt = JsonSerializer.Serialize(files);
        string jsonResponse = await completionClient.CompleteJsonAsync(
            QuickScanLlmPrompts.SystemPrompt,
            userPrompt,
            maxTokens: null,
            cancellationToken: cancellationToken);

        if (string.IsNullOrWhiteSpace(jsonResponse))
            return new QuickScanResult { Summary = "No response from LLM." };

        try
        {
            using JsonDocument doc = JsonDocument.Parse(jsonResponse);
            JsonElement root = doc.RootElement;

            string summary = root.TryGetProperty("summary", out JsonElement summaryElement)
                ? summaryElement.GetString() ?? string.Empty
                : string.Empty;

            List<ArchitectureFinding> findings = [];
            if (!root.TryGetProperty("findings", out JsonElement findingsElement) || findingsElement.ValueKind != JsonValueKind.Array)
                return new QuickScanResult { Summary = summary, Findings = findings };

            foreach (JsonElement findingElement in findingsElement.EnumerateArray())
            {
                string category = findingElement.TryGetProperty("category", out JsonElement c) ? c.GetString() ?? "General" : "General";
                string message = findingElement.TryGetProperty("message", out JsonElement m) ? m.GetString() ?? string.Empty : string.Empty;
                string severityStr = findingElement.TryGetProperty("severity", out JsonElement s) ? s.GetString() ?? "Info" : "Info";

                if (!Enum.TryParse(severityStr, true, out FindingSeverity severity))
                    severity = FindingSeverity.Info;

                double? confidenceScore = TryReadConfidenceScore(findingElement);
                FindingConfidenceLevel? confidenceLevel = TryReadConfidenceLevel(findingElement);

                findings.Add(new ArchitectureFinding
                {
                    Category = category,
                    Message = message,
                    Severity = severity,
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Topology, // Using Topology as a generic source for quick scan
                    ConfidenceScore = confidenceScore,
                    ConfidenceLevel = confidenceLevel
                });
            }

            return new QuickScanResult
            {
                Summary = summary,
                Findings = findings
            };
        }
        catch (JsonException)
        {
            return new QuickScanResult { Summary = "Failed to parse LLM response as JSON." };
        }
    }

    private static FindingConfidenceLevel? TryReadConfidenceLevel(JsonElement findingElement)
    {
        if (!findingElement.TryGetProperty("confidenceLevel", out JsonElement levelElement))
            return null;

        string raw = levelElement.GetString() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (!Enum.TryParse(raw, true, out FindingConfidenceLevel level))
            return null;

        return level;
    }

    private static double? TryReadConfidenceScore(JsonElement findingElement)
    {
        if (!findingElement.TryGetProperty("confidenceScore", out JsonElement scoreElement))
            return null;


        if (scoreElement.ValueKind == JsonValueKind.Null)
            return null;


        if (scoreElement.ValueKind == JsonValueKind.Number && scoreElement.TryGetDouble(out double value))
            return value;


        if (scoreElement.ValueKind == JsonValueKind.String
            && double.TryParse(scoreElement.GetString(), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double parsed))
            return parsed;

        return null;
    }
}
