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

    public const string PublicNetworkAccessHopEdgeType = "public-network-access";

    public const string UnrestrictedEgressHopEdgeType = "unrestricted-egress";
}
