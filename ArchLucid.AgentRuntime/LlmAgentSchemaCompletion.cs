using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared LLM → JSON schema validation loop for topology / compliance / critic handlers when the model emits invalid
///     structured payloads.
/// </summary>
public static class LlmAgentSchemaCompletion
{
    /// <summary>
    ///     Calls <paramref name="completionClient" />; on schema violations, JSON parse failures, or post-parse validation
    ///     errors retries with remediation text until attempts are exhausted or output validates.
    /// </summary>
    public static async Task<(string RawJson, AgentResult Parsed)> CompleteAsync(
        IAgentCompletionClient completionClient,
        IAgentResultParser resultParser,
        IOptionsMonitor<AgentSchemaRemediationOptions> remediationOptions,
        AgentType agentType,
        string runId,
        string taskId,
        string systemPrompt,
        string baseUserPrompt,
        int? maxTokensOverride = null,
        IAgentCompletionClient? remediationCompletionClient = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(completionClient);
        ArgumentNullException.ThrowIfNull(resultParser);
        ArgumentNullException.ThrowIfNull(remediationOptions);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);

        int maxAttempts = remediationOptions.CurrentValue.MaxCompletionAttempts;

        if (maxAttempts < 1)
            maxAttempts = 1;

        if (maxAttempts > AgentSchemaRemediationOptions.MaxCompletionAttemptsCeiling)
            maxAttempts = AgentSchemaRemediationOptions.MaxCompletionAttemptsCeiling;

        RemediationState? lastRemediation = null;

        for (int attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            string userPrompt = BuildUserPrompt(baseUserPrompt, lastRemediation);

            IAgentCompletionClient activeClient = lastRemediation is null
                ? completionClient
                : remediationCompletionClient ?? completionClient;

            string rawJson = await activeClient
                .CompleteJsonAsync(systemPrompt, userPrompt, maxTokens: maxTokensOverride, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            try
            {
                AgentResult parsed = resultParser.ParseAndValidate(
                    rawJson,
                    runId,
                    taskId,
                    agentType,
                    cancellationToken);

                return (rawJson, parsed);
            }
            catch (AgentResultSchemaViolationException ex)
            {
                if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                    throw;

                ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentType.ToString());

                lastRemediation = RemediationState.FromSchemaViolation(ex);
            }
            catch (AgentResultValidationException ex)
            {
                if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                    throw;

                ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentType.ToString());

                lastRemediation = RemediationState.FromPlainDetail(ex.Message);
            }
            catch (InvalidOperationException ex) when (IsRetryableAgentResultParseFailure(ex))
            {
                if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                    throw;

                ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentType.ToString());

                lastRemediation = RemediationState.FromPlainDetail(BuildParseFailureDetail(ex));
            }
        }

        throw new InvalidOperationException(
            $"Unexpected exit from agent schema completion loop ({agentType}, maxAttempts={maxAttempts}).");
    }

    private static bool MoreAttemptsRemain(int attemptIndex, int maxAttempts)
    {
        return attemptIndex < maxAttempts - 1;
    }

    private static bool IsRetryableAgentResultParseFailure(InvalidOperationException ex)
    {
        if (ex.InnerException is System.Text.Json.JsonException)
            return true;

        string msg = ex.Message;

        if (msg.Contains("empty JSON", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("null AgentResult", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("deserialize AgentResult", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("unsupported type mapping", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static string BuildParseFailureDetail(InvalidOperationException ex)
    {
        if (ex.InnerException is System.Text.Json.JsonException jx)
            return "JSON parse error: " + jx.Message.Trim();

        return ex.Message.Trim();
    }

    private static string BuildUserPrompt(string baseUserPrompt, RemediationState? remediation)
    {
        if (remediation is null)
            return baseUserPrompt;

        StringBuilder sb = new();

        sb.Append(baseUserPrompt.TrimEnd());
        sb.Append("\n\nRemediation: Correct the JSON ONLY. Previous output failed validation.\n");

        if (remediation.SchemaViolation is { } sv)
        {
            foreach (string line in sv.SchemaErrors.Select(static e => "- " + e.Trim()))
                sb.AppendLine(line);
        }

        if (!string.IsNullOrWhiteSpace(remediation.PlainTextDetail))
            sb.AppendLine("- " + remediation.PlainTextDetail.Trim());

        return sb.ToString();
    }

    private sealed record RemediationState(
        AgentResultSchemaViolationException? SchemaViolation,
        string? PlainTextDetail)
    {
        public static RemediationState FromSchemaViolation(AgentResultSchemaViolationException ex)
        {
            return new RemediationState(ex, null);
        }

        public static RemediationState FromPlainDetail(string detail)
        {
            return new RemediationState(null, detail);
        }
    }
}
