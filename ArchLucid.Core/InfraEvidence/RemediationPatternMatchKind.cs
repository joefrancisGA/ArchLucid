namespace ArchLucid.Core.InfraEvidence;

/// <summary>Deterministic match classification for operational findings to remediation patterns.</summary>
public enum RemediationPatternMatchKind
{
    ExactMatch = 0,
    ProbableMatch = 1,
    PossibleMatch = 2,
    NoMatch = 3,
    Conflict = 4,
}
