using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopManifestMergeResult
{
    public int MergedRecommendationCount
    {
        get;
        init;
    }

    public int MergedFindingCount
    {
        get;
        init;
    }

    public int GroundingDropCount
    {
        get;
        init;
    }
}

public interface IClosedLoopManifestMerger
{
    ClosedLoopManifestMergeResult MergeStrengtheningResult(
        ManifestDocument manifest,
        ClosedLoopReasoningResult result,
        ArchitectureRequest? architectureRequest);
}
