namespace ArchLucid.Core;

/// <summary>Discriminator for <see cref="CostLimitExceededException" /> so operators can distinguish token vs USD caps.</summary>
public enum CostLimitExceededKind
{
    /// <summary>Per-run USD ceiling breached.</summary>
    RunCostUsd = 0,

    /// <summary>Per-run token ceiling breached (TB-327).</summary>
    RunTokenBudget = 1,
}
