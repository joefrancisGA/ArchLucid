using System.Text;
using System.Text.Json;

using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;

using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     LLM → typed finding payload validation loop for engines that emit JSON payloads from model output.
/// </summary>
public static class FindingPayloadLlmRemediationCompletion
{
    private static readonly JsonSerializerOptions PayloadJsonOptions =
        new(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true };

    /// <summary>
    ///     Calls <paramref name="completionClient" />; on payload validation failures retries with remediation text
    ///     until attempts are exhausted or the finding validates.
    /// </summary>
    public static async Task<Finding> CompleteAsync(
        IFindingPayloadJsonCompletionClient completionClient,
        IFindingPayloadValidator validator,
        IOptionsMonitor<FindingPayloadRemediationOptions> remediationOptions,
        Finding findingEnvelope,
        string systemPrompt,
        string baseUserPrompt,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(completionClient);
        ArgumentNullException.ThrowIfNull(validator);
        ArgumentNullException.ThrowIfNull(remediationOptions);
        ArgumentNullException.ThrowIfNull(findingEnvelope);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUserPrompt);

        int maxAttempts = remediationOptions.CurrentValue.MaxCompletionAttempts;

        if (maxAttempts < 1)
            maxAttempts = 1;

        if (maxAttempts > FindingPayloadRemediationOptions.MaxCompletionAttemptsCeiling)
            maxAttempts = FindingPayloadRemediationOptions.MaxCompletionAttemptsCeiling;

        string? lastValidationError = null;

        for (int attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            string userPrompt = BuildUserPrompt(baseUserPrompt, lastValidationError, findingEnvelope);
            string rawJson = await completionClient
                .CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken)
                .ConfigureAwait(false);

            Finding candidate = MergePayload(findingEnvelope, rawJson);

            if (FindingPayloadValidatorExtensions.TryValidate(validator, candidate, out string? validationError))
            {
                AppendRemediationNote(candidate, attemptIndex);
                return candidate;
            }

            lastValidationError = validationError;

            if (attemptIndex >= maxAttempts - 1)
                break;
        }

        throw new InvalidOperationException(
            $"Finding payload validation failed after {maxAttempts} attempts for finding '{findingEnvelope.FindingId}' "
            + $"(FindingType={findingEnvelope.FindingType}). Last error: {lastValidationError}");
    }

    internal static Finding MergePayload(Finding findingEnvelope, string rawJson)
    {
        ArgumentNullException.ThrowIfNull(findingEnvelope);
        ArgumentException.ThrowIfNullOrWhiteSpace(rawJson);

        string normalizedJson = FindingPayloadConverter.NormalizeLlmJsonPayload(rawJson);

        object? payload = JsonSerializer.Deserialize<JsonElement>(normalizedJson, PayloadJsonOptions);

        Finding candidate = new()
        {
            FindingSchemaVersion = findingEnvelope.FindingSchemaVersion,
            FindingId = findingEnvelope.FindingId,
            FindingType = findingEnvelope.FindingType,
            Category = findingEnvelope.Category,
            EngineType = findingEnvelope.EngineType,
            Severity = findingEnvelope.Severity,
            Title = findingEnvelope.Title,
            Rationale = findingEnvelope.Rationale,
            RelatedNodeIds = findingEnvelope.RelatedNodeIds,
            RecommendedActions = findingEnvelope.RecommendedActions,
            Properties = findingEnvelope.Properties,
            PayloadType = findingEnvelope.PayloadType,
            Payload = payload,
            Trace = findingEnvelope.Trace,
            RequestInputRef = findingEnvelope.RequestInputRef,
            RunIdRef = findingEnvelope.RunIdRef,
            AgentExecutionTraceId = findingEnvelope.AgentExecutionTraceId,
            PolicyRuleId = findingEnvelope.PolicyRuleId,
        };

        return candidate;
    }

    private static void AppendRemediationNote(Finding finding, int attemptIndex)
    {
        if (attemptIndex == 0)
            return;

        finding.Trace ??= new ExplainabilityTrace();
        finding.Trace.Notes.Add($"Finding payload schema remediation succeeded after {attemptIndex} retries.");
    }

    private static string BuildUserPrompt(string baseUserPrompt, string? validationError, Finding findingEnvelope)
    {
        if (string.IsNullOrWhiteSpace(validationError))
            return baseUserPrompt;

        StringBuilder sb = new();

        sb.Append(baseUserPrompt.TrimEnd());
        sb.AppendLine();
        sb.AppendLine();
        sb.AppendLine("Remediation: Correct the JSON payload ONLY. Previous output failed validation.");
        sb.Append("- ");
        sb.AppendLine(validationError.Trim());

        if (!string.IsNullOrWhiteSpace(findingEnvelope.PayloadType))
        {
            sb.Append("- Expected payload type: ");
            sb.AppendLine(findingEnvelope.PayloadType.Trim());
        }

        sb.Append("- Finding type: ");
        sb.AppendLine(findingEnvelope.FindingType);

        return sb.ToString();
    }
}
