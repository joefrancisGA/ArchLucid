namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Locked honesty copy for SecureNow data-flow diagrams (SN-DF-04).
/// </summary>
public static class DiagramDataFlowHonestyLegend
{
    public const string PrimarySentence =
        "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.";

    public const string PipelineDirectionMissingSentence =
        "Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to.";

    public const string NoResolvedStoresOrSourcesSentence =
        "No resolved stores or named sources in this snapshot.";
}
