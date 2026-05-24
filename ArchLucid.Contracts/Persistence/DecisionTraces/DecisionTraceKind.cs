namespace ArchLucid.Contracts.Persistence.DecisionTraces;

/// <summary>
///     JSON discriminator for polymorphic <see cref="DecisionTraceDto" /> (<see cref="RunEventTraceDto" /> vs
///     <see cref="RuleAuditTraceDto" />).
/// </summary>
public enum DecisionTraceKind
{
    /// <summary>Merge/engine step log for string architecture runs (coordinator pipeline).</summary>
    RunEvent = 0,

    /// <summary>Authority rule-application audit from the decision engine.</summary>
    RuleAudit = 1
}
