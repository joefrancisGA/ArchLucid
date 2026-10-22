using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.QuickScan;

/// <inheritdoc cref="IQuickScanService" />
public sealed class QuickScanService(
    IAgentCompletionClient completionClient,
    IOptionsMonitor<QuickScanOptions> optionsMonitor,
    IOptionsMonitor<QuickScanSafetyOptions> safetyOptionsMonitor,
    TimeProvider timeProvider) : IQuickScanService
{
    public async Task<QuickScanResult> ScanAsync(IReadOnlyDictionary<string, string> files, CancellationToken cancellationToken = default)
    {
        if (files is null)
            throw new ArgumentNullException(nameof(files));

        if (completionClient is null)
            throw new ArgumentNullException(nameof(completionClient));

        QuickScanOptions options = QuickScanEffectiveLimits.Merge(
            optionsMonitor.CurrentValue,
            safetyOptionsMonitor.CurrentValue);
        int maxTokens = Math.Max(256, options.MaxOutputTokensPerScan);
        int maxAttempts = Math.Max(1, options.MaxModelCallsPerScan + options.MaxRetryCount);
        TimeSpan timeout = TimeSpan.FromSeconds(Math.Clamp(options.MaxProcessingDurationSeconds, 5, 120));

        string userPrompt = JsonSerializer.Serialize(files);
        string? jsonResponse = null;
        Exception? lastError = null;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            using CancellationTokenSource timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(timeout);

            try
            {
                jsonResponse = await completionClient.CompleteJsonAsync(
                    QuickScanLlmPrompts.SystemPrompt,
                    userPrompt,
                    maxTokens: maxTokens,
                    cancellationToken: timeoutCts.Token);

                break;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                lastError = new TimeoutException("Quick scan processing timed out.");
            }
            catch (Exception ex) when (attempt < maxAttempts - 1)
            {
                lastError = ex;
            }
        }

        if (jsonResponse is null)
        {
            return new QuickScanResult
            {
                Summary = lastError is TimeoutException
                    ? "Quick scan timed out before a result could be produced."
                    : "Quick scan could not be completed.",
                CompletedUtc = timeProvider.GetUtcNow().UtcDateTime,
            };
        }

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
                    SourceAgent = AgentType.Topology,
                    ConfidenceScore = confidenceScore,
                    ConfidenceLevel = confidenceLevel
                });
            }

            return new QuickScanResult
            {
                Summary = summary,
                Findings = findings,
                CompletedUtc = timeProvider.GetUtcNow().UtcDateTime,
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
