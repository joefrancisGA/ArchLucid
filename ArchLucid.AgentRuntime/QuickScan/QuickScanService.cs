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
                bool categoryStored = findingElement.TryGetProperty("category", out JsonElement categoryElement)
                    && !string.IsNullOrWhiteSpace(categoryElement.GetString());
                string category = categoryStored
                    ? categoryElement.GetString()!.Trim()
                    : "Category was not stored.";

                bool messageStored = findingElement.TryGetProperty("message", out JsonElement messageElement)
                    && !string.IsNullOrWhiteSpace(messageElement.GetString());
                string message = messageStored
                    ? messageElement.GetString()!.Trim()
                    : "Finding message was not stored.";

                bool severityStored = findingElement.TryGetProperty("severity", out JsonElement severityElement)
                    && !string.IsNullOrWhiteSpace(severityElement.GetString());
                string severityStr = severityStored ? severityElement.GetString()! : string.Empty;

                FindingSeverity severity = FindingSeverity.Info;

                if (severityStored
                    && Enum.TryParse(severityStr, true, out FindingSeverity parsedSeverity))
                {
                    severity = parsedSeverity;
                }

                double? confidenceScore = TryReadConfidenceScore(findingElement);
                FindingConfidenceLevel? confidenceLevel = TryReadConfidenceLevel(findingElement);

                AgentType sourceAgent = default;
                bool sourceAgentStored = findingElement.TryGetProperty("sourceAgent", out JsonElement sourceAgentElement)
                    && TryReadSourceAgent(sourceAgentElement, out sourceAgent);

                findings.Add(new ArchitectureFinding
                {
                    Category = category,
                    Message = message,
                    Severity = severity,
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = sourceAgentStored ? sourceAgent : default,
                    ConfidenceScore = confidenceScore,
                    ConfidenceLevel = confidenceLevel,
                    ReasoningTrace = severityStored
                        ? null
                        : "Severity was not stored.",
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

    private static bool TryReadSourceAgent(JsonElement element, out AgentType agentType)
    {
        agentType = default;

        if (element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        string? raw = element.GetString();

        return !string.IsNullOrWhiteSpace(raw)
            && Enum.TryParse(raw, true, out agentType);
    }
}
