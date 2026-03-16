using System.Linq;
using ArchiForge.Application.Diagrams;

namespace ArchiForge.Application.Analysis;

public sealed class ConsultingDocxArchitectureAnalysisExportService
    : IArchitectureAnalysisConsultingDocxExportService
{
    private readonly IDiagramImageRenderer _diagramImageRenderer;
    private readonly IConsultingDocxTemplateOptionsProvider _optionsProvider;
    private readonly IDocumentLogoProvider _logoProvider;

    public ConsultingDocxArchitectureAnalysisExportService(
        IDiagramImageRenderer diagramImageRenderer,
        IConsultingDocxTemplateOptionsProvider optionsProvider,
        IDocumentLogoProvider logoProvider)
    {
        _diagramImageRenderer = diagramImageRenderer;
        _optionsProvider = optionsProvider;
        _logoProvider = logoProvider;
    }

    public async Task<byte[]> GenerateDocxAsync(
        ArchitectureAnalysisReport report,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(report);

        var options = _optionsProvider.GetOptions();

        return await ConsultingDocxOpenXmlComposer.GenerateAsync(
            report,
            options,
            _diagramImageRenderer,
            _logoProvider,
            cancellationToken);
    }
}

