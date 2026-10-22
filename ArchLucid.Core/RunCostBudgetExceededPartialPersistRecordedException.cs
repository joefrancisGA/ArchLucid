namespace ArchLucid.Core;

/// <summary>
///     Raised when a run-level USD/token cap trips after partially persisting agent outputs; bookkeeping is done and the API
///     should bubble this outward as <c>402</c> with optional extensions.
/// </summary>
public sealed class RunCostBudgetExceededPartialPersistRecordedException : Exception
{
    /// <inheritdoc cref="RunCostBudgetExceededPartialPersistRecordedException" />
    public RunCostBudgetExceededPartialPersistRecordedException(
        CostLimitExceededException budgetCause,
        int persistedAgentOutputCount)
        : base(FormatMessage(budgetCause, persistedAgentOutputCount), budgetCause)
    {
        PersistedAgentOutputCount = persistedAgentOutputCount;
    }

    /// <inheritdoc cref="Exception.InnerException" />
    public CostLimitExceededException BudgetCause =>
        InnerException as CostLimitExceededException ?? throw new InvalidOperationException(
            "Expected inner CostLimitExceededException (constructor always sets budgetCause as inner).");

    /// <summary>Stored <c>AgentResult</c> rows prior to emitting this fault.</summary>
    public int PersistedAgentOutputCount
    {
        get;
    }

    private static string FormatMessage(CostLimitExceededException budgetCause, int persistedAgentOutputCount)
    {
        ArgumentNullException.ThrowIfNull(budgetCause);

        return
            $"{budgetCause.Message.TrimEnd()} Partial execute persisted {persistedAgentOutputCount} agent output row(s); re-run execute to finish remaining agents.";
    }
}
