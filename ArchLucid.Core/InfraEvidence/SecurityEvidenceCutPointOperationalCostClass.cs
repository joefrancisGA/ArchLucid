namespace ArchLucid.Core.InfraEvidence;

/// <summary>Coarse operational cost to remove a cut point (SA-10).</summary>
public enum SecurityEvidenceCutPointOperationalCostClass
{
    PublicAccessProperty = 0,
    PrivateEndpointDns = 1,
    NetworkNsG = 2,
    RoleAssignment = 3,
    IdentityFederation = 4,
    Unknown = 5,
}
