namespace ArchLucid.Core.InfraEvidence;

/// <summary>Plain-language why strings for attack path report unevaluated groups (SN-APR-02).</summary>
public static class SecurityEvidencePathReportReasonCatalog
{
    public static string GetWhyText(string reasonCode, int? limitValue = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reasonCode);

        return reasonCode switch
        {
            SecurityEvidencePathReportReasonCodes.NsgNotCollected =>
                "A subnet on this path has no collected network security rules, so reachability was not fully evaluated.",
            SecurityEvidencePathReportReasonCodes.DnsNotCollected =>
                "Private DNS for this path was missing from the snapshot, so name resolution was not verified.",
            SecurityEvidencePathReportReasonCodes.CustomDnsResolverNotCollected =>
                "The virtual network uses custom DNS, and the resolver was not collected, so private name resolution was not verified.",
            SecurityEvidencePathReportReasonCodes.NetworkEdgeControlNotCollected =>
                "A firewall, Application Gateway, Front Door, network virtual appliance, or forced-tunnel route sits on this path and its rules were not evaluated.",
            SecurityEvidencePathReportReasonCodes.EgressNotCollected =>
                "Subnet egress was not collected or not verified, so outbound reachability stays open.",
            SecurityEvidencePathReportReasonCodes.InsufficientEvidenceUnspecified =>
                "This path is marked insufficient evidence and no more specific gap was recorded.",
            SecurityEvidencePathReportReasonCodes.ControlPlaneOnlyNoObservedTraffic =>
                "The control plane allows this path. Observed traffic was not collected, so the path is not listed as vulnerable.",
            SecurityEvidencePathReportReasonCodes.SearchStoppedMaxPaths =>
                FormatLimitTemplate(
                    "Path search stopped after {limit} paths. Later paths in that engine were not enumerated.",
                    limitValue),
            SecurityEvidencePathReportReasonCodes.SearchStoppedMaxDepth =>
                FormatLimitTemplate(
                    "Path search stopped at depth {limit}. Longer paths were not enumerated.",
                    limitValue),
            SecurityEvidencePathReportReasonCodes.SearchStoppedMaxFanOut =>
                FormatLimitTemplate(
                    "Path search stopped after {limit} edges from one node. Other edges from that node were not enumerated.",
                    limitValue),
            _ => throw new ArgumentOutOfRangeException(nameof(reasonCode), reasonCode, "Unknown attack path report reason code."),
        };
    }

    public static string GetToxicCombinationSearchStoppedWhyText(
        SecurityEvidencePathSearchLimitKind limitKind,
        int limitValue)
    {
        string template = limitKind switch
        {
            SecurityEvidencePathSearchLimitKind.MaxPaths =>
                "Privilege or intended-reachability search stopped after {limit} paths. Toxic combinations use only the paths those engines stored.",
            SecurityEvidencePathSearchLimitKind.MaxDepth =>
                "Privilege or intended-reachability search stopped at depth {limit}. Toxic combinations use only the paths those engines stored.",
            SecurityEvidencePathSearchLimitKind.MaxFanOut =>
                "Privilege or intended-reachability search stopped after {limit} edges from one node. Toxic combinations use only the paths those engines stored.",
            _ => throw new ArgumentOutOfRangeException(nameof(limitKind), limitKind, "Unknown search limit kind."),
        };

        return template.Replace("{limit}", limitValue.ToString(), StringComparison.Ordinal);
    }

    public static IReadOnlyList<string> InsufficientEvidenceEdgeReasonCodesInOrder() =>
    [
        SecurityEvidencePathReportReasonCodes.NsgNotCollected,
        SecurityEvidencePathReportReasonCodes.DnsNotCollected,
        SecurityEvidencePathReportReasonCodes.CustomDnsResolverNotCollected,
        SecurityEvidencePathReportReasonCodes.NetworkEdgeControlNotCollected,
        SecurityEvidencePathReportReasonCodes.EgressNotCollected,
    ];

    private static string FormatLimitTemplate(string template, int? limitValue)
    {
        if (limitValue is null)
        {
            throw new ArgumentException("Limit value is required for search-stopped why text.", nameof(limitValue));
        }

        return template.Replace("{limit}", limitValue.Value.ToString(), StringComparison.Ordinal);
    }
}
