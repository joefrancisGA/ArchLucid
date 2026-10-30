using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     JSON projection of proof-of-ROI deltas for a single run (<c>GET /v1/pilots/runs/.../pilot-run-deltas</c>).
/// </summary>
public sealed class PilotRunDeltasResponse
{
    public DateTime? ExtractorCollectionTimestampUtc
    {
        get;
        init;
    }

    public double? TimeToCommittedManifestTotalSeconds
    {
        get;
        init;
    }

    public DateTime? ManifestCommittedUtc
    {
        get;
        init;
    }

    public DateTime RunCreatedUtc
    {
        get;
        init;
    }

    private IReadOnlyList<PilotRunDeltaSeverityCountResponse> findingsBySeverity = [];

    public IReadOnlyList<PilotRunDeltaSeverityCountResponse> FindingsBySeverity
    {
        get => findingsBySeverity;
        init => findingsBySeverity = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public int AuditRowCount
    {
        get;
        init;
    }

    public bool AuditRowCountTruncated
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="false" /> when the scoped audit count query failed — <see cref="AuditRowCount" /> is then a
    ///     sentinel and must not be read as an attested zero.
    /// </summary>
    public bool AuditRowCountResolved
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     Per-run LLM completion rows when <see cref="LlmCallCountResolved" /> is <see langword="true" />; otherwise
    ///     <see langword="null" />.
    /// </summary>
    public int? LlmCallCount
    {
        get;
        init;
    }

    /// <summary>
    ///     <see langword="false" /> when the per-run execution-trace query failed — <see cref="LlmCallCount" /> is then
    ///     <see langword="null" />, not an attested call tally.
    /// </summary>
    public bool LlmCallCountResolved
    {
        get;
        init;
    } = true;

    public string? TopFindingSeverity
    {
        get;
        init;
    }

    public string? TopFindingId
    {
        get;
        init;
    }

    public FindingEvidenceChainResponse? TopFindingEvidenceChain
    {
        get;
        init;
    }

    public bool IsDemoTenant
    {
        get;
        init;
    }

    /// <summary>
    ///     When <see langword="true" />, this run is seeded sample workspace data and must not export via CLI proof packets.
    /// </summary>
    public bool IsSampleRun
    {
        get;
        init;
    }

    /// <summary>
    ///     Sum of accepted Cost-category findings' projected USD impact from the run's findings snapshot, when loaded.
    /// </summary>
    public decimal? EstimatedUsdSavings
    {
        get;
        init;
    }

    /// <summary>
    ///     Proof-package completeness checklist + buyer-safe gate labels (same evaluation as the first-value Markdown gate section).
    /// </summary>
    public ProofPackageCompletenessResponse? ProofPackageCompleteness
    {
        get;
        init;
    }

    /// <summary>ROI source catalog rows for the tenant value window aligned with this run (proof-packet).</summary>
    private IReadOnlyList<RoiMetricSourceRow> roiMetricSources = [];

    public IReadOnlyList<RoiMetricSourceRow> RoiMetricSources
    {
        get => roiMetricSources;
        init => roiMetricSources = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>PASS, WARN, or HOLD — server-side ROI freshness disposition (assessment #6).</summary>
    public string RoiSourceFreshnessDisposition
    {
        get;
        init;
    } = "PASS";

    /// <summary>
    ///     Governed-finding coverage metric computed from decision-grade findings in this run.
    ///     <see cref="GovernedFindingCoverageMetric.IsAvailable" /> is <see langword="false" /> when
    ///     the run has no findings — surface as "not available" rather than "0 of 0".
    /// </summary>
    public GovernedFindingCoverageMetric? GovernedFindingCoverage
    {
        get;
        init;
    }

    /// <summary>CG-027 — persisted structural execution mode for CLI proof-packet posture (INV-002).</summary>
    public StructuralExecutionMode? StructuralExecutionMode
    {
        get;
        init;
    }

    /// <summary>CG-027 — execute door stamp for CLI bundle manifests (<see cref="User.WorkingCareerRehearsalDoorValues" />).</summary>
    public string? WorkingCareerRehearsalDoor
    {
        get;
        init;
    }
}

/// <summary>One severity bucket from <see cref="PilotRunDeltasResponse.FindingsBySeverity" />.</summary>
public sealed class PilotRunDeltaSeverityCountResponse
{
    public string Severity
    {
        get;
        init;
    } = string.Empty;

    public int Count
    {
        get;
        init;
    }
}
