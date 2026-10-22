using ArchLucid.Api.Contracts;
using ArchLucid.Contracts.Runs;

namespace ArchLucid.Api.Models.Runs;

/// <summary>Run detail first paint: buyer summary, progress summary, manifest summary, and artifacts.</summary>
public sealed class RunDetailCriticalPageBundleResponse
{
    public BuyerRunDetailSummaryDto BuyerSummary
    {
        get;
        init;
    } = null!;

    public RunSummaryResponse? ProgressSummary
    {
        get;
        init;
    }

    public ManifestSummaryResponse? ManifestSummary
    {
        get;
        init;
    }

    public IReadOnlyList<ArtifactDescriptorResponse> Artifacts
    {
        get;
        init;
    } = [];
}
