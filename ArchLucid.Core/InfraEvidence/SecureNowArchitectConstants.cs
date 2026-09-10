namespace ArchLucid.Core.InfraEvidence;

public static class SecureNowArchitectConstants
{
    public const string SourceSystem = "ArchLucid.SecureNowArchitect";

    public const string SystemActorId = "securenow-architect";

    public const string PrivilegePathControlId = "securenow.privilege-path";

    public const string IntendedReachabilityControlId = "securenow.intended-reachability";

    public const string ToxicCombinationControlId = "securenow.toxic-combination";

    /// <summary>Synthetic start node for internet-facing exposure paths (SA-05).</summary>
    public const string InternetPublicExposureNodeId = "internet://public-exposure";

    /// <summary>Synthetic terminal node for unrestricted outbound NSG paths (SA-06).</summary>
    public const string InternetEgressNodeId = "internet://egress";

    public const string InsufficientEvidenceNsgHopEdgeType = "nsg-not-collected-or-unassociated";

    public const string PublicNetworkAccessHopEdgeType = "public-network-access";

    public const string UnrestrictedEgressHopEdgeType = "unrestricted-egress";
}
