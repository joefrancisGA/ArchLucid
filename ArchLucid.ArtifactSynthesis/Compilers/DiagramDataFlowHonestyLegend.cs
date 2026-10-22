namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Locked honesty copy for SecureNow data-flow diagrams (SN-DF-04, SN-PE-06).
/// </summary>
public static class DiagramDataFlowHonestyLegend
{
    public const string DeclaredPipelinePrimarySentence =
        "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.";

    /// <summary>Backward-compatible alias for SN-DF-04 tests.</summary>
    public const string PrimarySentence = DeclaredPipelinePrimarySentence;

    public const string EvidenceFamiliesPrimarySentence =
        "Evidence of possible or declared movement, not observed traffic. Reads from / Writes to are pipeline wiring. May access is identity authorization. Private network path is a DNS-joined private endpoint hop, not usage.";

    public const string AuthorizedAccessBandSentence =
        "May access edges are authorization evidence (Probable band), not observed traffic.";

    public const string PrivateNetworkPathDnsSentence =
        "Private network path requires a private DNS zone link to the application's VNet.";

    public const string ObservedRuntimeTimeWindowSentence =
        "Observed in logs edges reflect a bounded diagnostic time window, not the architecture.";

    public const string PipelineDirectionMissingSentence =
        "Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to.";

    public const string NoResolvedStoresOrSourcesSentence =
        "No resolved stores or named sources in this snapshot.";
}
