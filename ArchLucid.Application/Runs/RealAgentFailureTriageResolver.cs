namespace ArchLucid.Application.Runs;

using ArchLucid.Contracts.Agents;

/// <summary>
///     Maps failure summaries and optional run context to assessment #23 triage scenario ids.
/// </summary>
public static class RealAgentFailureTriageResolver
{
    public static string? ResolveScenarioId(
        AgentExecutionFailureSummary summary,
        RealAgentFailureTriageContext? context = null)
    {
        ArgumentNullException.ThrowIfNull(summary);

        if (context?.RealModeFellBackToSimulator == true)
        {
            return RealAgentFailureTriageScenarioIds.FallbackToSimulator;
        }

        if (string.Equals(
                summary.FailureClass,
                AgentExecutionFailureClasses.MissingCredentials,
                StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.MissingCredentials;
        }

        if (string.Equals(summary.FailureClass, AgentExecutionFailureClasses.ContentSafety, StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.ContentSafetyRejection;
        }

        if (string.Equals(summary.FailureClass, AgentExecutionFailureClasses.Parse, StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.SchemaViolation;
        }

        if (string.Equals(summary.FailureClass, AgentExecutionFailureClasses.QualityGate, StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.GroundingInsufficiency;
        }

        if (string.Equals(summary.FailureClass, AgentExecutionFailureClasses.Timeout, StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.Timeout;
        }

        if (string.Equals(summary.FailureClass, AgentExecutionFailureClasses.CostBudget, StringComparison.Ordinal)
            || string.Equals(summary.FailureClass, AgentExecutionFailureClasses.Quota, StringComparison.Ordinal))
        {
            return RealAgentFailureTriageScenarioIds.BudgetCutoff;
        }

        return null;
    }

    public static AgentExecutionFailureSummary EnrichWithTriage(
        AgentExecutionFailureSummary summary,
        RealAgentFailureTriageContext? context = null)
    {
        ArgumentNullException.ThrowIfNull(summary);

        summary.TriageScenarioId = ResolveScenarioId(summary, context);
        return summary;
    }
}
