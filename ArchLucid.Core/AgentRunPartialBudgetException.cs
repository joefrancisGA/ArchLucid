using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core;

/// <summary>
///     At least one agent handler completed before a per-run USD/token cap was exceeded elsewhere in the batch.
///     The orchestrator may persist <see cref="CompletedResults" /> when configured, then surface
///     <see cref="BudgetCause" /> via <see cref="Exception.InnerException" /> (also exposed as typed
///     <see cref="BudgetCause" />).
/// </summary>
public sealed class AgentRunPartialBudgetException : Exception
{
    /// <summary>Builds the exception with captured successful <see cref="AgentResult" /> rows.</summary>
    public AgentRunPartialBudgetException(CostLimitExceededException budgetCause, IReadOnlyList<AgentResult> completedResults)
        : base(budgetCause.Message, budgetCause)
    {
        ArgumentNullException.ThrowIfNull(budgetCause);
        ArgumentNullException.ThrowIfNull(completedResults);

        CompletedResults = completedResults;
    }

    /// <summary>Budget breach that halted the executor batch.</summary>
    public CostLimitExceededException BudgetCause => (CostLimitExceededException)InnerException!;

    /// <summary>
    ///     Handlers that ran to completion before the budget breach (parallel peers may have been cancelled).
    /// </summary>
    public IReadOnlyList<AgentResult> CompletedResults
    {
        get;
    }
}
