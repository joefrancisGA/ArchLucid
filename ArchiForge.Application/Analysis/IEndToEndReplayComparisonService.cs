namespace ArchiForge.Application.Analysis;

public interface IEndToEndReplayComparisonService
{
    Task<EndToEndReplayComparisonReport> BuildAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default);
}

