namespace ArchLucid.Core.InfraEvidence;

/// <summary>Stable reason codes for the attack path report unevaluated section.</summary>
public static class SecurityEvidencePathReportReasonCodes
{
    public const string NsgNotCollected = SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType;

    public const string DnsNotCollected = SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType;

    public const string CustomDnsResolverNotCollected =
        SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType;

    public const string NetworkEdgeControlNotCollected =
        SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType;

    public const string EgressNotCollected = SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType;

    public const string InsufficientEvidenceUnspecified = "insufficient-evidence-unspecified";

    public const string ControlPlaneOnlyNoObservedTraffic = "control-plane-only-no-observed-traffic";

    public const string SearchStoppedMaxPaths = "search-stopped-max-paths";

    public const string SearchStoppedMaxDepth = "search-stopped-max-depth";

    public const string SearchStoppedMaxFanOut = "search-stopped-max-fan-out";
}
