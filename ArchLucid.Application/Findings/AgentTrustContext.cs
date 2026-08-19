namespace ArchLucid.Application.Findings;

/// <summary>
///     Carries execution-context signals that are not stored directly on
///     <see cref="ArchLucid.Contracts.Findings.ArchitectureFinding" /> but that influence
///     how much an operator or sponsor should trust the finding.
/// </summary>
/// <param name="IsSimulatorDerived">
///     True when the agent result was produced by the deterministic simulator.
/// </param>
/// <param name="IsDegraded">
///     True when the agent result carries a non-null <c>DegradationReasonCode</c>.
/// </param>
/// <param name="IsRealModel">
///     True when the agent result was produced by a live LLM (not simulator, not degraded).
///     Mutually exclusive with <paramref name="IsSimulatorDerived" /> in well-formed results.
/// </param>
public sealed record AgentTrustContext(
    bool IsSimulatorDerived,
    bool IsDegraded,
    bool IsRealModel = false);
