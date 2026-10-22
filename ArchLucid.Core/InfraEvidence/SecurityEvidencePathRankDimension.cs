namespace ArchLucid.Core.InfraEvidence;

/// <summary>Independent ranking dimensions for SecureNow architect paths (SA-09).</summary>
public enum SecurityEvidencePathRankDimension
{
    TechnicalExposure = 0,
    PrivilegeDepth = 1,
    BlastRadius = 2,
    BusinessConsequence = 3,
    ConfidenceBand = 4,
}
