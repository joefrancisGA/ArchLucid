namespace ArchLucid.Core.InfraEvidence;

/// <summary>SecureNow architect path classification (SA-01).</summary>
public enum PathKind
{
    Privilege = 0,
    IntendedReachability = 1,
    CapabilityToFlow = 2,
    SharedControlBlastRadius = 3,
    ToxicCombination = 4,
    FourRealityDrift = 5,
}
