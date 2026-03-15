namespace ArchiForge.Application.Analysis;

public interface IArchitectureAnalysisService
{
    Task<ArchitectureAnalysisReport> BuildAsync(
        ArchitectureAnalysisRequest request,
        CancellationToken cancellationToken = default);
}
