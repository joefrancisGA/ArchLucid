namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Locked honesty copy for SecureNow data-flow diagrams (SN-DF-04, SN-PE-06).
/// </summary>
public static class DiagramDataFlowHonestyLegend
{
    /// <summary>Short authorization overlay on Executive and Data Flow canvases; honesty detail lives in captions.</summary>
    public const string MayAccessOverlayEdgeLabel = "Authorization may allow access. Observed use was not stored.";

    public const string DeclaredPipelinePrimarySentence =
        "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.";

    /// <summary>Backward-compatible alias for SN-DF-04 tests.</summary>
    public const string PrimarySentence = DeclaredPipelinePrimarySentence;

    public const string EvidenceFamiliesPrimarySentence =
        "Evidence of possible or declared movement, not observed traffic. Configured dataset read/write labels are pipeline wiring, not observed reads or writes. Authorization may allow access labels are identity authorization, not observed use. Private network path is a DNS-joined private endpoint hop, not usage.";

    public const string AuthorizedAccessBandSentence =
        "Authorization may allow access labels are authorization evidence (Probable band), not observed use.";

    public const string PrivateNetworkPathDnsSentence =
        "Private network path is a DNS-joined private endpoint hop. Private DNS zone link was not stored in this snapshot.";

    public const string ObservedRuntimeTimeWindowSentence =
        "Observed in logs edges reflect a bounded diagnostic time window, not the architecture.";

    public const string PipelineDirectionMissingSentence =
        "Pipeline direction was not stored in this package. Re-collect Azure inventory to refresh pipeline metadata.";

    public const string NoResolvedStoresOrSourcesSentence =
        "No resolved stores or named sources in this snapshot.";

    public const string OmittedDataFlowStagesSentencePrefix =
        "Data flow stages omitted from this snapshot:";
}
