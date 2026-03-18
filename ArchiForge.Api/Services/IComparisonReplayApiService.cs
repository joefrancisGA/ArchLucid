using ArchiForge.Application.Analysis;

namespace ArchiForge.Api.Services;

public interface IComparisonReplayApiService
{
    Task<ReplayComparisonResult> ReplayAsync(
        ReplayComparisonRequest request,
        bool metadataOnly,
        CancellationToken cancellationToken = default);

    Task<DriftAnalysisResult> AnalyzeDriftAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default);
}

