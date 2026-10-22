namespace ArchLucid.Core.InfraEvidence;

/// <summary>Weighted factor in explainable remediation prioritization (IE-15).</summary>
public enum RemediationRiskFactor
{
    Severity = 0,
    Exploitability = 1,
    KnownExploitation = 2,
    InternetExposure = 3,
    IdentityControlPlaneImpact = 4,
    AssetCriticality = 5,
    DataSensitivity = 6,
    BlastRadius = 7,
    CompensatingControls = 8,
    RemediationComplexity = 9,
    RemediationRisk = 10,
}
