using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Resilience;

using Polly.Timeout;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Builds <see cref="AgentExecutionFailureSummary" /> from execution exceptions without copying raw provider or LLM
///     text into API-facing fields.
/// </summary>
public static class AgentExecutionFailureSummaryFactory
{
    public static AgentExecutionFailureSummary FromException(
        Exception ex,
        RealAgentFailureTriageContext? triageContext = null)
    {
        ArgumentNullException.ThrowIfNull(ex);
        AgentHandlerExecutionException? agentEx = FindAgentHandlerExecutionException(ex);

        Exception root = agentEx?.InnerException ?? SelectPrimaryCause(ex);

        AgentExecutionFailureSummary summary = new()
        {
            AgentTypeKey = agentEx?.AgentTypeKey,
            AgentType = agentEx?.AgentType.ToString(),
            FailureClass = Classify(root),
            ReasonCode = ResolveReasonCode(root)
        };

        return RealAgentFailureTriageResolver.EnrichWithTriage(summary, triageContext);
    }

    internal static AgentHandlerExecutionException? FindAgentHandlerExecutionException(Exception ex)
    {
        if (ex is AgentHandlerExecutionException direct)
        {
            return direct;
        }

        if (ex is not AggregateException aggregateException)
            return ex.InnerException is null ? null : FindAgentHandlerExecutionException(ex.InnerException);
        foreach (Exception inner in aggregateException.Flatten().InnerExceptions)
        {
            AgentHandlerExecutionException? hit = FindAgentHandlerExecutionException(inner);

            if (hit is not null)
            {
                return hit;
            }
        }

        return ex.InnerException is null ? null : FindAgentHandlerExecutionException(ex.InnerException);
    }

    internal static Exception SelectPrimaryCause(Exception ex)
    {
        if (ex is not AggregateException aggregateException)
            return ex;

        IReadOnlyCollection<Exception> inners = aggregateException.Flatten().InnerExceptions;

        List<Exception> preferred =
            inners.Where(static e => e is not OperationCanceledException and not TaskCanceledException).ToList();

        if (preferred.Count == 1)
        {
            return preferred[0];
        }

        return preferred.Count > 1 ? preferred[0] : ex;
    }

    internal static string Classify(Exception root)
    {
        if (root is TimeoutRejectedException)
        {
            return AgentExecutionFailureClasses.Timeout;
        }

        if (root is OperationCanceledException or TaskCanceledException)
        {
            return AgentExecutionFailureClasses.Canceled;
        }

        if (root is JsonException)
        {
            return AgentExecutionFailureClasses.Parse;
        }

        if (root is AgentOutputQualityGateRejectedException)
        {
            return AgentExecutionFailureClasses.QualityGate;
        }

        if (root is CircuitBreakerOpenException)
        {
            return AgentExecutionFailureClasses.CircuitBreaker;
        }

        if (root is LlmTokenQuotaExceededException)
        {
            return AgentExecutionFailureClasses.Quota;
        }

        if (root is CostLimitExceededException)
        {
            return AgentExecutionFailureClasses.CostBudget;
        }

        if (root is HttpRequestException or IOException)
        {
            return AgentExecutionFailureClasses.Dependency;
        }

        if (root is InvalidOperationException invalidOperation)
        {
            if (IsContentSafetyBlocked(invalidOperation))
            {
                return AgentExecutionFailureClasses.ContentSafety;
            }

            if (IsMissingAzureOpenAiCredentials(invalidOperation))
            {
                return AgentExecutionFailureClasses.MissingCredentials;
            }

            return AgentExecutionFailureClasses.InvalidOperation;
        }

        return root is ArgumentException ? AgentExecutionFailureClasses.InvalidOperation : AgentExecutionFailureClasses.Unknown;
    }

    internal static bool IsContentSafetyBlocked(InvalidOperationException ex)
    {
        string message = ex.Message;

        return message.Contains("content safety", StringComparison.OrdinalIgnoreCase)
               || message.Contains("Blocked by content safety", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsMissingAzureOpenAiCredentials(InvalidOperationException ex)
    {
        string message = ex.Message;

        if (message.Contains("AzureOpenAI", StringComparison.OrdinalIgnoreCase)
            && message.Contains("required", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return message.Contains("AzureOpenAI:Endpoint is not configured", StringComparison.OrdinalIgnoreCase);
    }

    internal static string? ResolveReasonCode(Exception root)
    {
        if (root is CircuitBreakerOpenException)
        {
            return AgentExecutionTraceFailureReasonCodes.CircuitBreakerRejected;
        }

        if (root is LlmTokenQuotaExceededException)
        {
            return AgentExecutionTraceFailureReasonCodes.LlmTokenQuotaExceeded;
        }

        return root is CostLimitExceededException ? AgentExecutionTraceFailureReasonCodes.RunCostLimitExceeded : null;
    }
}
