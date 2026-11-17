using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Api.Tests;

internal sealed class ForcedComparisonVerificationFailureReplayService : IComparisonReplayService
{
    public Task<ReplayComparisonResult> ReplayAsync(
        ReplayComparisonRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new ComparisonVerificationFailedException(
            "Regenerated comparison does not match stored payload.",
            new DriftAnalysisResult { DriftDetected = true, Summary = "integration-test drift" });
    }

    public Task<DriftAnalysisResult> AnalyzeDriftAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new DriftAnalysisResult());
    }

    public Task EnsureArtifactReplayAccessAllowedAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
