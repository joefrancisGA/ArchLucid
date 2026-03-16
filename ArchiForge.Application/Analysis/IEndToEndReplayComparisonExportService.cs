namespace ArchiForge.Application.Analysis;

public interface IEndToEndReplayComparisonExportService
{
    string GenerateMarkdown(EndToEndReplayComparisonReport report);

    Task<byte[]> GenerateDocxAsync(
        EndToEndReplayComparisonReport report,
        CancellationToken cancellationToken = default);
}

