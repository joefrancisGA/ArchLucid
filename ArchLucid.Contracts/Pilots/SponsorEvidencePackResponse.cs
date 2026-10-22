namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Single JSON bundle for sponsor-facing proof: explainability completeness, live process counters, optional
///     demo-run value-report deltas, and governance outcomes.
/// </summary>
public sealed class SponsorEvidencePackResponse
{
    /// <summary>UTC instant this pack was assembled.</summary>
    public DateTimeOffset GeneratedUtc
    {
        get;
        init;
    }

    /// <summary>Canonical Contoso Retail demo run id used for delta and findings snapshot loads.</summary>
    public string DemoRunId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>
    ///     Same cumulative counters as <see cref="WhyArchLucidSnapshotResponse" /> — shared with
    ///     <c>GET /v1/pilots/why-archlucid-snapshot</c> and <c>GET /v1/tenant/measured-roi</c>.
    /// </summary>
    private WhyArchLucidSnapshotResponse processInstrumentation = new();

    public WhyArchLucidSnapshotResponse ProcessInstrumentation
    {
        get => processInstrumentation;
        init => processInstrumentation = value ?? new();
    }

    private ExplainabilityTraceCompletenessPack explainabilityTrace = new();

    public ExplainabilityTraceCompletenessPack ExplainabilityTrace
    {
        get => explainabilityTrace;
        init => explainabilityTrace = value ?? new();
    }

    /// <summary>
    ///     Proof-of-ROI deltas for <see cref="DemoRunId" /> when the run exists in scope; otherwise <see langword="null" />.
    /// </summary>
    public PilotRunDeltasResponse? DemoRunValueReportDelta
    {
        get;
        init;
    }

    private SponsorEvidenceGovernanceOutcomes governanceOutcomes = new();

    public SponsorEvidenceGovernanceOutcomes GovernanceOutcomes
    {
        get => governanceOutcomes;
        init => governanceOutcomes = value ?? new();
    }
}
