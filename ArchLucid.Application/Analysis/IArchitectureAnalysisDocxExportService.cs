namespace ArchLucid.Application.Analysis;

public interface IArchitectureAnalysisDocxExportService
{
    Task<byte[]> GenerateDocxAsync(
        ArchitectureAnalysisReport report,
        CancellationToken cancellationToken = default);
}
