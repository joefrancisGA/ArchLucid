namespace ArchLucid.Core.InfraEvidence;

/// <summary>Whether a match was produced by deterministic rules or an AI proposal.</summary>
public enum RemediationPatternMatchSource
{
    Deterministic = 0,
    AIProposed = 1,
}
