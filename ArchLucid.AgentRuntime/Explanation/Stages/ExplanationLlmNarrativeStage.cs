using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Decisioning.Validation;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Explanation.Stages;

/// <inheritdoc cref="IExplanationLlmNarrativeStage" />
public sealed class ExplanationLlmNarrativeStage(
    IAgentCompletionClient completionClient,
    IOptions<ExplanationServiceOptions> explanationOptions,
    ISchemaValidationService schemaValidation,
    ILogger<ExplanationLlmNarrativeStage> logger) : IExplanationLlmNarrativeStage
{
    private const string ArchitectSystemPrompt =
        "You are a senior enterprise architect. Be concise but authoritative. " +
        "Ground every statement in the facts provided; do not invent services or decisions not listed. " +
        "When responding with structured JSON, you must populate alternativesConsidered: " +
        "include at least one rejected architectural alternative and a brief reason it was discarded.";

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IOptions<ExplanationServiceOptions> _explanationOptions =
        explanationOptions ?? throw new ArgumentNullException(nameof(explanationOptions));

    private readonly ISchemaValidationService _schemaValidation =
        schemaValidation ?? throw new ArgumentNullException(nameof(schemaValidation));

    private readonly ILogger<ExplanationLlmNarrativeStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public Task<string?> CompleteAndValidateComparisonAsync(string userPrompt, CancellationToken ct) =>
        CompleteAndValidateAsync(
            userPrompt,
            validate: json => _schemaValidation.ValidateComparisonExplanationJson(json),
            schemaKind: "comparison",
            skipSchemaVersionCheck: false,
            ct);

    /// <inheritdoc />
    public Task<string?> CompleteAndValidateRunAsync(string userPrompt, CancellationToken ct) =>
        CompleteAndValidateAsync(
            userPrompt,
            validate: json => _schemaValidation.ValidateExplanationRunJson(json),
            schemaKind: "run",
            skipSchemaVersionCheck: true,
            ct);

    private async Task<string?> CompleteAndValidateAsync(
        string userPrompt,
        Func<string, SchemaValidationResult> validate,
        string schemaKind,
        bool skipSchemaVersionCheck,
        CancellationToken ct)
    {
        string? json = await TryCompleteJsonAsync(userPrompt, _explanationOptions.Value.MaxTokens, ct);

        return await ValidatePayloadAsync(
            json,
            userPrompt,
            validate,
            schemaKind,
            skipSchemaVersionCheck,
            ct);
    }

    private async Task<string?> ValidatePayloadAsync(
        string? json,
        string userPrompt,
        Func<string, SchemaValidationResult> validate,
        string schemaKind,
        bool skipSchemaVersionCheck,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(json))
            return json;

        string trimmed = json.Trim();

        if (skipSchemaVersionCheck)
        {
            if (!trimmed.StartsWith("{", StringComparison.Ordinal)
                || !TryGetRunExplanationSchemaVersion(trimmed, out int ver)
                || ver != 1)
            {
                ArchLucidInstrumentation.RecordExplanationSchemaValidation(schemaKind, "skipped");

                return json;
            }
        }
        else if (!trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            ArchLucidInstrumentation.RecordExplanationSchemaValidation(schemaKind, "skipped");

            return json;
        }

        SchemaValidationResult schemaResult = validate(trimmed);

        if (schemaResult.IsValid)
        {
            ArchLucidInstrumentation.RecordExplanationSchemaValidation(schemaKind, "valid");

            return json;
        }

        ArchLucidInstrumentation.RecordExplanationSchemaValidation(schemaKind, "invalid");

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "{SchemaKind} explanation LLM JSON failed schema validation; retrying. Errors: {@Errors}",
                schemaKind,
                schemaResult.Errors);
        }

        string? retryJson = await TryCompleteJsonAsync(
            userPrompt,
            _explanationOptions.Value.MaxTokens,
            ct,
            temperature: 0.1f);

        if (string.IsNullOrWhiteSpace(retryJson))
            return null;

        SchemaValidationResult retrySchemaResult = validate(retryJson.Trim());

        if (retrySchemaResult.IsValid)
        {
            ArchLucidInstrumentation.RecordExplanationRetrySuccess(schemaKind);

            return retryJson;
        }

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "{SchemaKind} explanation LLM JSON failed schema validation on retry; using deterministic fallback.",
                schemaKind);
        }

        return null;
    }

    private static bool TryGetRunExplanationSchemaVersion(string json, out int version)
    {
        version = 0;

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("schemaVersion", out JsonElement el)
                && el.ValueKind == JsonValueKind.Number
                && el.TryGetInt32(out int v))
            {
                version = v;

                return true;
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private async Task<string?> TryCompleteJsonAsync(
        string userPrompt,
        int? maxTokens,
        CancellationToken ct,
        float? temperature = null)
    {
        try
        {
            string raw = await _completionClient.CompleteJsonAsync(
                ArchitectSystemPrompt,
                userPrompt,
                maxTokens,
                temperature,
                ct);

            return UnwrapJsonFence(raw);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM completion failed in ExplanationLlmNarrativeStage; falling back to heuristic response.");

            return null;
        }
    }

    private static string? UnwrapJsonFence(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return raw;

        string s = raw.Trim();

        if (!s.StartsWith("```", StringComparison.Ordinal))
            return s;

        int firstNl = s.IndexOf('\n');

        if (firstNl > 0)
            s = s[(firstNl + 1)..].Trim();

        int end = s.LastIndexOf("```", StringComparison.Ordinal);

        if (end > 0)
            s = s[..end].Trim();

        return s;
    }
}
