using ArchLucid.Core.Diagrams;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Generates consulting-grade DOCX reports from an <see cref = "ArchitectureAnalysisReport"/>
///     using a profile-driven template via <see cref = "ConsultingDocxOpenXmlComposer"/>.
/// </summary>
public sealed class ConsultingDocxArchitectureAnalysisExportService(
    IDiagramImageRenderer diagramImageRenderer,
    IConsultingDocxTemplateOptionsProvider optionsProvider,
    IDocumentLogoProvider logoProvider) : IArchitectureAnalysisConsultingDocxExportService
{
    private readonly IConsultingDocxTemplateOptionsProvider _optionsProvider = optionsProvider ?? throw new ArgumentNullException(nameof(optionsProvider));
    private readonly IDocumentLogoProvider _logoProvider = logoProvider ?? throw new ArgumentNullException(nameof(logoProvider));
    private readonly IDiagramImageRenderer _diagramImageRenderer = diagramImageRenderer ?? throw new ArgumentNullException(nameof(diagramImageRenderer));

    public async Task<byte[]> GenerateDocxAsync(ArchitectureAnalysisReport report, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(report);
        ConsultingDocxTemplateOptions options = optionsProvider.GetOptions();
        return await ConsultingDocxOpenXmlComposer.GenerateAsync(report, options, diagramImageRenderer, logoProvider, cancellationToken);
    }
}
