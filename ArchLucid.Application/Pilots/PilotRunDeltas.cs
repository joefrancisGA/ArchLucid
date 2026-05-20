using ArchLucid.Contracts.Explanation;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Computed proof-of-ROI numbers for a single architecture run, as rendered by both
///     <see cref="FirstValueReportBuilder" /> (Markdown) and <see cref="SponsorOnePagerPdfBuilder" /> (PDF).
///     Replaces baseline placeholder cells in those reports — the values are read straight from persisted
///     run state so a sponsor can compare them against their pre-pilot baseline.
/// </summary>
/// <remarks>
///     <para>
///         <strong>Demo provenance (<see cref="IsDemoTenant" />):</strong> when the run is one of the canonical
///         <see cref="Bootstrap.ContosoRetailDemoIdentifiers" /> records, every consumer MUST render a clear
///         "demo tenant — replace before publishing" banner so the seeded numbers cannot accidentally be
///         quoted as a real-customer outcome.
///     </para>
///     <para>
///         <see cref="AuditRowCountTruncated" /> is legacy: <see cref="PilotRunDeltaComputer" /> now uses
///         <c>IAuditRepository.CountFilteredAsync</c> for an exact run-scoped total when the query succeeds (otherwise count 0).
///     </para>
/// </remarks>
public sealed record PilotRunDeltas
{
    /// <summary>Wall-clock elapsed time from <c>RunRecord.CreatedUtc</c> to manifest commit.</summary>
    public TimeSpan? TimeToCommittedManifest
    {
        get;
        init;
    }

    /// <summary>UTC timestamp when the manifest was committed (<c>GoldenManifest.Metadata.CreatedUtc</c>).</summary>
    public DateTime? ManifestCommittedUtc
    {
        get;
        init;
    }

    /// <summary>UTC timestamp the run record was created (<c>RunRecord.CreatedUtc</c>).</summary>
    public DateTime RunCreatedUtc
    {
        get;
        init;
    }

    /// <summary>Findings-by-severity counts taken from <c>ArchitectureRunDetail.Results[*].Findings</c>, ordered descending.</summary>
    public IReadOnlyList<KeyValuePair<string, int>> FindingsBySeverity
    {
        get;
        init;
    } = [];

    /// <summary>Persisted audit rows in scope that reference this run id.</summary>
    public int AuditRowCount
    {
        get;
        init;
    }

    /// <summary>Reserved; <see cref="PilotRunDeltaComputer" /> leaves this <see langword="false" /> for successful count queries.</summary>
    public bool AuditRowCountTruncated
    {
        get;
        init;
    }

    /// <summary>Persisted <c>AgentExecutionTrace</c> rows for this run; one row per LLM completion call.</summary>
    public int LlmCallCount
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="false" /> when the trace repository query failed — <see cref="LlmCallCount" /> is not attested.
    /// </summary>
    public bool LlmCallCountResolved
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     Severity of the top-severity finding identified for the evidence-chain excerpt, or <see langword="null" />
    ///     when no findings exist.
    /// </summary>
    public string? TopFindingSeverity
    {
        get;
        init;
    }

    /// <summary>
    ///     Finding id chosen for the evidence-chain excerpt, or <see langword="null" /> when no findings exist on this
    ///     run.
    /// </summary>
    public string? TopFindingId
    {
        get;
        init;
    }

    /// <summary>
    ///     Decision-trace pointers for <see cref="TopFindingId" />, or <see langword="null" /> when the chain could not
    ///     be resolved.
    /// </summary>
    public FindingEvidenceChainResponse? TopFindingEvidenceChain
    {
        get;
        init;
    }

    /// <summary>Run is a Contoso Retail demo seed (canonical RunId or per-tenant request prefix); reports MUST flag this.</summary>
    public bool IsDemoTenant
    {
        get;
        init;
    }

    /// <summary>
    ///     Rolled-up projected USD savings from the run's persisted findings snapshot (<see langword="null" /> when unavailable).
    /// </summary>
    public decimal? EstimatedUsdSavings
    {
        get;
        init;
    }

    /// <summary>
    ///     Rows returned from <see cref="ArchLucid.Persistence.Queries.IArtifactQueryService.ListArtifactsByManifestIdAsync" />
    ///     when <see cref="ArchLucid.Contracts.Metadata.ArchitectureRun.GoldenManifestId" /> was present; otherwise
    ///     <see langword="null" /> when not queried or the lookup failed (warnings logged — sponsor surfaces stay honest).
    /// </summary>
    public int? SynthesizedArtifactDescriptorCount
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="true"/> when <see cref="SynthesizedArtifactDescriptorCount"/> reflects a successful artifact list query.
    /// </summary>
    public bool SynthesizedArtifactDescriptorCountResolved
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="true"/> when execution traces loaded successfully enough to evaluate PilotStrict posture for this run.
    /// </summary>
    public bool AgentOutputPilotStrictSignalsResolved
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     When quality gate PilotStrict mode is enabled server-side and <see cref="AgentOutputPilotStrictSignalsResolved"/>
    ///     is <see langword="true"/>, a value of <see langword="true"/> means sponsor-facing PilotStrict checks failed.
    /// </summary>
    public bool AgentOutputPilotStrictViolatesSponsorEvidence
    {
        get;
        init;
    }
}
