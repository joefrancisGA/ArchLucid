namespace ArchLucid.Application.Budgeting;

/// <summary>
///     Read-only UTC-month LLM dollar budget posture for the current tenant — mirrors the pre-call gate in
///     <see cref="ArchLucid.AgentRuntime.LlmMonthlyTenantDollarBudgetTracker" /> without mutating counters.
/// </summary>
public interface ILlmMonthlyTenantDollarBudgetStatusService
{
    /// <summary>Returns budget fields and whether another LLM-backed completion would be hard-rejected.</summary>
    Task<LlmMonthlyTenantDollarBudgetStatusResult> GetStatusAsync(CancellationToken cancellationToken = default);
}
