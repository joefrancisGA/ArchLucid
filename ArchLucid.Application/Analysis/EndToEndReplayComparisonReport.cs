using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     The aggregate output of an end-to-end replay comparison between two architecture runs,
///     including run-metadata diff, agent-result diff, manifest diff, and export-record diffs.
/// </summary>
public sealed class EndToEndReplayComparisonReport
{
    /// <summary>Run identifier of the baseline (left) run.</summary>
    public string LeftRunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Run identifier of the candidate (right) run.</summary>
    public string RightRunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Top-level metadata differences between the two runs (status, manifest version, etc.).</summary>
    public RunMetadataDiffResult RunDiff
    {
        get;
        set;
    } = new();

    /// <summary>Per-agent-type diff of results. <c>null</c> when agent-result comparison was not performed.</summary>
    public AgentResultDiffResult? AgentResultDiff
    {
        get;
        set;
    }

    /// <summary>Structural diff of the golden manifests produced by each run. <c>null</c> when not applicable.</summary>
    public ManifestDiffResult? ManifestDiff
    {
        get;
        set;
    }

    /// <summary>Diffs between corresponding export records from the two runs. Empty when no export records were compared.</summary>
    public List<ExportRecordDiffResult> ExportDiffs
    {
        get;
        set;
    } = [];

    /// <summary>Human-readable notes explaining the significance of detected changes. May be empty.</summary>
    public List<string> InterpretationNotes
    {
        get;
        set;
    } = [];

    /// <summary>Non-fatal warnings encountered during comparison (e.g. missing manifests). May be empty.</summary>
    public List<string> Warnings
    {
        get;
        set;
    } = [];

    /// <summary>Cross-review finding correlation metadata for export honesty (TB-2043).</summary>
    public ComparisonFindingCorrelationMetadata? FindingCorrelation
    {
        get;
        set;
    }

    /// <summary>Aggregate finding lifecycle counts and the claim-honest note that qualifies them (TB-2194).</summary>
    public CrossReviewFindingLifecycleSummary? FindingLifecycle
    {
        get;
        set;
    }

    /// <summary>Per-finding lifecycle position across the two reviews (TB-2194). Empty when neither run had findings.</summary>
    public List<CrossReviewFindingLifecycleRecord> FindingLifecycleRecords
    {
        get;
        set;
    } = [];
}
