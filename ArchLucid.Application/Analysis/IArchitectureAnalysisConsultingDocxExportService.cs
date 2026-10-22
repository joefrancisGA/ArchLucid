namespace ArchLucid.Application.Analysis;

public interface IArchitectureAnalysisConsultingDocxExportService
{
    Task<byte[]> GenerateDocxAsync(
        ArchitectureAnalysisReport report,
        ConsultingDocxExportBranding? branding = null,
        CancellationToken cancellationToken = default);
}
