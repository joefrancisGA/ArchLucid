namespace ArchLucid.Core.Budgeting;

/// <summary>Window discriminator for unified <see cref="ILlmTenantBudgetRepository" /> rows.</summary>
public enum LlmBudgetPeriod
{
    Daily,

    Monthly,

    /// <summary>UTC-day token cap for LLM-as-judge completions only (isolated from <see cref="Daily" /> run-execution pool).</summary>
    JudgeDaily
}
