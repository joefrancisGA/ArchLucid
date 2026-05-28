namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Operator-facing trust calibration label for a finding or explanation surface.
///     Derived deterministically from existing structured fields (evidence refs, confidence level,
///     execution context) — never from ad-hoc string matching against free-form text.
/// </summary>
public enum FindingTrustLabel
{
    /// <summary>
    ///     Finding has at least one evidence reference and a medium-or-high evaluation confidence score.
    ///     The strongest trust signal: a human reviewer can follow the evidence chain.
    /// </summary>
    EvidenceBacked = 0,

    /// <summary>
    ///     Finding has evidence references but low evaluation confidence (e.g. from weak retrieval or
    ///     partial grounding). The evidence exists but the conclusion is not strongly supported.
    /// </summary>
    Estimated = 1,

    /// <summary>
    ///     Finding has no evidence references and is explicitly labeled with
    ///     <see cref="FindingConfidenceLevel.Low" />, indicating the agent applied heuristic reasoning
    ///     rather than grounded retrieval.
    /// </summary>
    Heuristic = 2,

    /// <summary>
    ///     The agent result was produced by the deterministic simulator, not a live LLM.
    ///     Findings are structurally valid but should not be cited as real-model evidence.
    /// </summary>
    SimulatorDerived = 3,

    /// <summary>
    ///     The agent result was produced by a live LLM and has at least one evidence reference.
    ///     Used when execution context is known to be real-model and the result is grounded.
    /// </summary>
    RealModel = 4,

    /// <summary>
    ///     The agent output was flagged as degraded (e.g. circuit-breaker fallback, parse failure,
    ///     or explicit <c>DegradationReasonCode</c> on the <c>AgentResult</c>).
    ///     Operators should treat this finding with heightened scepticism.
    /// </summary>
    Degraded = 5,

    /// <summary>
    ///     Finding has no evidence references and no heuristic label.
    ///     This indicates a potential gap in the evidence chain that should be reviewed.
    /// </summary>
    MissingCitation = 6,

    /// <summary>
    ///     Finding was produced by a deterministic rule engine rather than an LLM, and does not
    ///     require evidence references. Reserved for rule-derived findings where the rationale
    ///     comes from the rule itself, not from retrieval.
    /// </summary>
    DeterministicFallback = 7,
}
