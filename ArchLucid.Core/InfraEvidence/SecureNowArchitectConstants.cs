namespace ArchLucid.Core.InfraEvidence;

public static class SecureNowArchitectConstants
{
    public const string SourceSystem = "ArchLucid.SecureNowArchitect";

    public const string SystemActorId = "securenow-architect";

    public const string PrivilegePathControlId = "securenow.privilege-path";

    public const string IntendedReachabilityControlId = "securenow.intended-reachability";

    /// <summary>Synthetic start node for internet-facing exposure paths (SA-05).</summary>
    public const string InternetPublicExposureNodeId = "internet://public-exposure";

    public const string InsufficientEvidenceNsgHopEdgeType = "nsg-not-collected-or-unassociated";

    public const string PublicNetworkAccessHopEdgeType = "public-network-access";
}
