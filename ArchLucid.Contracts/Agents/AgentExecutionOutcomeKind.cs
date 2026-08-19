namespace ArchLucid.Contracts.Agents;

/// <summary>Per-required-agent outcome for partial-run honesty (TB-937).</summary>
public enum AgentExecutionOutcomeKind
{
    /// <summary>No persisted result for this required agent type.</summary>
    Missing = 0,

    /// <summary>Persisted non-degraded result with meaningful output.</summary>
    Succeeded = 1,

    /// <summary>Persisted result carries <see cref="AgentResult.DegradationReasonCode"/>.</summary>
    Degraded = 2,

    /// <summary>Persisted row exists but is empty / not meaningful (treat as failed for commit).</summary>
    Failed = 3,

    /// <summary>Dependent agent output is inconsistent with upstream agent result versions (TB-942).</summary>
    Stale = 4,
}
