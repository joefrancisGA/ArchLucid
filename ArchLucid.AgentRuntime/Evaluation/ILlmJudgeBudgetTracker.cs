namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Fail-open peek for the isolated judge UTC-day token pool (TB-190 / PQ-AI-02).</summary>
public interface ILlmJudgeBudgetTracker
{
    /// <summary>Returns false when the next judge call would exceed the configured judge daily cap.</summary>
    Task<bool> TryPeekWithinBudgetAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>Increments <c>archlucid_llm_judge_budget_exhausted_total</c> when a judge path skips due to cap.</summary>
    void RecordBudgetExhausted();
}
