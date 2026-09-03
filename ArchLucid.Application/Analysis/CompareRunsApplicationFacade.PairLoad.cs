using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public async Task<ScopedRunPairLoadResult> LoadScopedRunPairAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken ct)
    {
        Task<ArchitectureRunDetail?> leftDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(leftRunId, ct);
        Task<ArchitectureRunDetail?> rightDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(rightRunId, ct);
        await Task.WhenAll(leftDetailTask, rightDetailTask);

        ArchitectureRunDetail? left = await leftDetailTask;
        if (left is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
                MissingRunId = leftRunId,
            };
        }

        ArchitectureRunDetail? right = await rightDetailTask;
        if (right is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
                MissingRunId = rightRunId,
            };
        }

        return new ScopedRunPairLoadResult
        {
            Outcome = ScopedRunPairLoadOutcome.Success,
            Left = left,
            Right = right,
        };
    }
}
