namespace ArchLucid.Core.InfraEvidence;

/// <summary>Endpoint kinds participating in security crosswalk many-to-many edges.</summary>
public enum SecurityCrosswalkEndpointKind
{
    AuditControl = 0,
    McsbControl = 1,
    AzurePolicyDefinition = 2,
    AzurePolicyInitiative = 3,
    DefenderRecommendation = 4,
    OperationalSecurityFinding = 5,
    RemediationPattern = 6,
    ArchitecturePolicyRule = 7,
    AuditEvidenceRequirement = 8,
}
