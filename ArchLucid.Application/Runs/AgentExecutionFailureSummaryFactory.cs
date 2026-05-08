using System.Text.Json;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core;
using ArchLucid.Core.Resilience;

using Polly.Timeout;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Builds <see cref="AgentExecutionFailureSummary" /> from execution exceptions without copying raw provider or LLM
///     text into API-facing fields.
/// </summary>
public static class AgentExecutionFailureSummaryFactory
{
    public static AgentExecutionFailureSummary FromException(Exception ex)
    {
        ArgumentNullException.ThrowIfNull(ex);
        AgentHandlerExecutionException? agentEx = FindAgentHandlerExecutionException(ex);

        Exception root = agentEx?.InnerException ?? SelectPrimaryCause(ex);

        return new AgentExecutionFailureSummary
        {
            AgentTypeKey = agentEx?.AgentTypeKey,
            AgentType = agentEx?.AgentType.ToString(),
            FailureClass = Classify(root),
            ReasonCode = ResolveReasonCode(root)
        };
    }

    internal static AgentHandlerExecutionException? FindAgentHandlerExecutionException(Exception ex)
    {
        if (ex is AgentHandlerExecutionException direct)
        {
            return direct;
        }

        if (ex is AggregateException aggregateException)
        {
            foreach (Exception inner in aggregateException.Flatten().InnerExceptions)
            {
                AgentHandlerExecutionException? hit = FindAgentHandlerExecutionException(inner);

                if (hit is not null)
                {
                    return hit;
                }
            }
        }

        return ex.InnerException is null ? null : FindAgentHandlerExecutionException(ex.InnerException);
    }

    internal static Exception SelectPrimaryCause(Exception ex)
    {
        if (ex is AggregateException aggregateException)
        {
            IReadOnlyCollection<Exception> inners = aggregateException.Flatten().InnerExceptions;

            List<Exception> preferred =
                inners.Where(static e => e is not OperationCanceledException and not TaskCanceledException).ToList();

            if (preferred.Count == 1)
            {
                return preferred[0];
            }

            if (preferred.Count > 1)
            {
                return preferred[0];
            }
        }

        return ex;
    }

    internal static string Classify(Exception root)
    {
        if (root is TimeoutRejectedException)
        {
            return AgentExecutionFailureClasses.Timeout;
        }

        if (root is OperationCanceledException || root is TaskCanceledException)
        {
            return AgentExecutionFailureClasses.Canceled;
        }

        if (root is JsonException)
        {
            return AgentExecutionFailureClasses.Parse;
        }

        if (root is CircuitBreakerOpenException)
        {
            return AgentExecutionFailureClasses.CircuitBreaker;
        }

        if (root is LlmTokenQuotaExceededException)
        {
            return AgentExecutionFailureClasses.Quota;
        }

        if (root is HttpRequestException or IOException)
        {
            return AgentExecutionFailureClasses.Dependency;
        }

        if (root is InvalidOperationException or ArgumentException)
        {
            return AgentExecutionFailureClasses.InvalidOperation;
        }

        return AgentExecutionFailureClasses.Unknown;
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

        return null;
    }
}
