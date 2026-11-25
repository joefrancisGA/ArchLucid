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

        // The configured hard timeout covers the whole scan, including retries.
        // Creating a new timer for each attempt would multiply the admitted budget.
        using CancellationTokenSource scanBudget = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        scanBudget.CancelAfter(timeout);

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (scanBudget.IsCancellationRequested)
                break;

            try
            {
                jsonResponse = await completionClient.CompleteJsonAsync(
                    QuickScanLlmPrompts.SystemPrompt,
                    userPrompt,
                    maxTokens: maxTokens,
                    cancellationToken: scanBudget.Token);

                // Some providers can return a result after cancellation was requested.
                // Never report a successful scan beyond the hard processing budget.
                cancellationToken.ThrowIfCancellationRequested();
                scanBudget.Token.ThrowIfCancellationRequested();
                break;
            }
            catch (Exception)
            {
                // A provider can fail with a non-cancellation exception after the caller stops the scan.
                cancellationToken.ThrowIfCancellationRequested();
                if (scanBudget.IsCancellationRequested)
                    break;

                // Retry within the remaining budget, or return a bounded failure after the final attempt.
            }
        }

        cancellationToken.ThrowIfCancellationRequested();
        bool deadlineReached = scanBudget.IsCancellationRequested;
        if (deadlineReached)
        {
            // The deadline is authoritative even when an upstream client ignores cancellation.
            jsonResponse = null;
        }

        if (jsonResponse is null)
        {
            return new QuickScanResult
            {
                Summary = deadlineReached
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
            if (root.ValueKind != JsonValueKind.Object)
                return UnparseableResponse();

            string summary = ReadStringProperty(root, "summary") ?? string.Empty;

            List<ArchitectureFinding> findings = [];

            if (!root.TryGetProperty("findings", out JsonElement findingsElement) || findingsElement.ValueKind != JsonValueKind.Array)
                return new QuickScanResult { Summary = summary, Findings = findings };

            foreach (JsonElement findingElement in findingsElement.EnumerateArray())
            {
                if (findingElement.ValueKind != JsonValueKind.Object)
                    continue;

                string? category = ReadStringProperty(findingElement, "category");
                string? message = ReadStringProperty(findingElement, "message");
                string? severityText = ReadStringProperty(findingElement, "severity");
                FindingSeverity severity = default;
                bool severityParsed = !string.IsNullOrWhiteSpace(severityText)
                    && global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(severityText, true, out severity);

                double? confidenceScore = TryReadConfidenceScore(findingElement);
                FindingConfidenceLevel? confidenceLevel = TryReadConfidenceLevel(findingElement);

                AgentType sourceAgent = default;
                bool sourceAgentStored = findingElement.TryGetProperty("sourceAgent", out JsonElement sourceAgentElement)
                    && TryReadSourceAgent(sourceAgentElement, out sourceAgent);

                findings.Add(new ArchitectureFinding
                {
                    Category = string.IsNullOrWhiteSpace(category) ? "Category was not stored." : category.Trim(),
                    Message = string.IsNullOrWhiteSpace(message) ? "Finding message was not stored." : message.Trim(),
                    Severity = severity,
                    SeverityStored = severityParsed,
                    SourceAgentStored = sourceAgentStored,
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = sourceAgentStored ? sourceAgent : default,
                    ConfidenceScore = confidenceScore,
                    ConfidenceLevel = confidenceLevel,
                    ReasoningTrace = severityParsed
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
            return UnparseableResponse();
        }
    }

    private static QuickScanResult UnparseableResponse() =>
        new() { Summary = "Failed to parse LLM response as JSON." };

    private static string? ReadStringProperty(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static FindingConfidenceLevel? TryReadConfidenceLevel(JsonElement findingElement)
    {
        string? raw = ReadStringProperty(findingElement, "confidenceLevel");

        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (!global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(raw, true, out FindingConfidenceLevel level))
            return null;

        return level;
    }

    private static double? TryReadConfidenceScore(JsonElement findingElement)
    {
        if (!findingElement.TryGetProperty("confidenceScore", out JsonElement scoreElement))
            return null;


        if (scoreElement.ValueKind == JsonValueKind.Null)
            return null;


        if (scoreElement.ValueKind == JsonValueKind.Number && scoreElement.TryGetDouble(out double value)
            && double.IsFinite(value))
            return value;


        if (scoreElement.ValueKind == JsonValueKind.String
            && double.TryParse(scoreElement.GetString(), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out double parsed)
            && double.IsFinite(parsed))
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
            && global::ArchLucid.Contracts.Serialization.DefinedEnum.TryParse(raw, true, out agentType);
    }
}
