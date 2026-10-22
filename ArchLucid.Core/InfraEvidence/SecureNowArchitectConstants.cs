namespace ArchLucid.Core.InfraEvidence;

public static class SecureNowArchitectConstants
{
    public const string SourceSystem = "ArchLucid.SecureNowArchitect";

    public const string SystemActorId = "securenow-architect";

    public const string PrivilegePathControlId = "securenow.privilege-path";

    public const string IntendedReachabilityControlId = "securenow.intended-reachability";

    public const string ToxicCombinationControlId = "securenow.toxic-combination";

    /// <summary>Ordinal Defender posture band on toxic-combination findings — never a numeric score.</summary>
    public const string DefenderSecureScoreBandMetadataKey = "defenderSecureScoreBand";

    public const string CapabilityToFlowControlId = "securenow.capability-to-flow";

    public const string SharedControlBlastRadiusControlId = "securenow.shared-control-blast-radius";

    public const string FourRealityDriftControlId = "securenow.four-reality-drift";

    public const string FourRealityDriftHopEdgeType = "four-reality-drift";

    public const string FourRealityDriftTerminalNodeId = "reality-drift://public-access-widened";

    public const string SharedControlFanOutHopEdgeType = "shared-control-fan-out";

    /// <summary>Synthetic hop for possible information movement (SA-07) — never ObservedFact.</summary>
    public const string PossibleMovementHopEdgeType = "possible-movement";

    public const string InsufficientEvidenceEgressHopEdgeType = "egress-not-collected-or-unverified";

    /// <summary>Synthetic start node for internet-facing exposure paths (SA-05).</summary>
    public const string InternetPublicExposureNodeId = "internet://public-exposure";

    /// <summary>Synthetic terminal node for unrestricted outbound NSG paths (SA-06).</summary>
    public const string InternetEgressNodeId = "internet://egress";

    public const string InsufficientEvidenceNsgHopEdgeType = "nsg-not-collected-or-unassociated";

    /// <summary>Private DNS join or resolver evidence missing for an intended private path (Ch. 7).</summary>
    public const string InsufficientEvidenceDnsHopEdgeType = "dns-not-collected-or-unverified";

    /// <summary>VNet custom DNS resolvers without collected answers (Ch. 7).</summary>
    public const string InsufficientEvidenceCustomDnsResolverHopEdgeType = "custom-dns-resolver-not-collected-or-unverified";

    /// <summary>Azure Firewall, App Gateway, Front Door, NVA, or gateway hop not fully evaluable (SA-05 / Ch. 7).</summary>
    public const string InsufficientEvidenceNetworkEdgeControlHopEdgeType = "network-edge-control-not-collected-or-unverified";

    /// <summary>Network-edge control allow hop from stored control-plane rules (SN-APR-05).</summary>
    public const string NetworkEdgeControlAllowedHopEdgeType = "network-edge-control-allowed";

    public const string PublicNetworkAccessHopEdgeType = "public-network-access";

    public const string UnrestrictedEgressHopEdgeType = "unrestricted-egress";
}
