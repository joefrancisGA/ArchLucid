namespace ArchLucid.Core.InfraEvidence;

/// <summary>Why multiple remediation pattern candidates could not be resolved deterministically.</summary>
public enum RemediationPatternMatchConflictType
{
    DuplicateExactMatch = 0,
    ContradictoryStrategy = 1,
    VersionSkew = 2,
}
