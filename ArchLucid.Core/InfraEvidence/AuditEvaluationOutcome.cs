namespace ArchLucid.Core.InfraEvidence;

/// <summary>Deterministic automated evaluation outcome for an audit control (not an auditor conclusion).</summary>
public enum AuditEvaluationOutcome
{
    InsufficientEvidence = 0,
    TechnicallySupported = 1,
    TechnicallyNotSupported = 2,
}
