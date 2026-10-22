using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;
using ArchLucid.Application.Runs.Finalization;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Re-evaluates required-capability coverage after closed-loop topology enrichment and updates open findings.
/// </summary>
public static class ClosedLoopRequiredCapabilityFindingsRefresher
{
    private static readonly RequiredCapabilityCoverageAnalyzer Analyzer = new();

    public static ClosedLoopRequiredCapabilityRefreshResult RefreshOpenFinding(
        FindingsSnapshot findingsSnapshot,
        GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(findingsSnapshot);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        Finding? existing = findingsSnapshot.Findings.FirstOrDefault(FinalizeQualityFindingSignals.IsRequiredCapabilityCoverage);

        if (existing is null)
        {
            return new ClosedLoopRequiredCapabilityRefreshResult();
        }

        RequiredCapabilityCoverageResult analysis = Analyzer.Analyze(graphSnapshot);

        if (analysis.RequiredCapabilities.Count == 0)
        {
            return new ClosedLoopRequiredCapabilityRefreshResult();
        }

        if (analysis.MissingCapabilities.Count == 0)
        {
            existing.IsMuted = true;
            existing.Rationale =
                "Required capabilities are now evidenced after closed-loop topology enrichment; finding muted.";
            existing.Trace ??= new ExplainabilityTrace();
            existing.Trace.DecisionsTaken.Add("Closed-loop topology enrichment satisfied all required capabilities.");

            return new ClosedLoopRequiredCapabilityRefreshResult
            {
                MutedRequiredCapabilityFinding = true,
                MissingCapabilityCountAfterRefresh = 0,
            };
        }

        existing.Title = "Required capabilities are not fully evidenced on the context graph";
        existing.Rationale =
            "One or more required capabilities asserted on the request lack matching topology, security, or requirement evidence "
            + "after closed-loop topology enrichment.";
        existing.PayloadType = nameof(RequiredCapabilityCoverageFindingPayload);
        existing.Payload = new RequiredCapabilityCoverageFindingPayload
        {
            RequiredCapabilities = analysis.RequiredCapabilities,
            SatisfiedCapabilities = analysis.SatisfiedCapabilities,
            MissingCapabilities = analysis.MissingCapabilities,
            CoverageScorePercent = analysis.CoverageScorePercent,
        };
        existing.Trace ??= new ExplainabilityTrace();
        existing.Trace.DecisionsTaken =
        [
            $"Coverage score {analysis.CoverageScorePercent}% with {analysis.MissingCapabilities.Count} missing capabilities after closed-loop enrichment.",
        ];
        existing.Trace.Notes = [$"Missing: {string.Join(", ", analysis.MissingCapabilities)}"];

        return new ClosedLoopRequiredCapabilityRefreshResult
        {
            UpdatedRequiredCapabilityFinding = true,
            MissingCapabilityCountAfterRefresh = analysis.MissingCapabilities.Count,
        };
    }
}

public sealed class ClosedLoopRequiredCapabilityRefreshResult
{
    public bool MutedRequiredCapabilityFinding
    {
        get;
        init;
    }

    public bool UpdatedRequiredCapabilityFinding
    {
        get;
        init;
    }

    public int MissingCapabilityCountAfterRefresh
    {
        get;
        init;
    }
}
