using ArchLucid.Application.Exports;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Generates consulting-grade DOCX reports from an <see cref = "ArchitectureAnalysisReport"/>
///     using a profile-driven template via <see cref = "ConsultingDocxOpenXmlComposer"/>.
/// </summary>
public sealed class ConsultingDocxArchitectureAnalysisExportService(
    IDiagramImageRenderer diagramImageRenderer,
    IConsultingDocxTemplateOptionsProvider optionsProvider,
    IDocumentLogoProvider logoProvider,
    ITenantReportBrandingApplyHelper reportBrandingApplyHelper,
    IScopeContextProvider scopeProvider,
    IAuthorityQueryService authorityQueryService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IConfiguration configuration) : IArchitectureAnalysisConsultingDocxExportService
{
    private readonly IConsultingDocxTemplateOptionsProvider _optionsProvider = optionsProvider ?? throw new ArgumentNullException(nameof(optionsProvider));
    private readonly IDocumentLogoProvider _logoProvider = logoProvider ?? throw new ArgumentNullException(nameof(logoProvider));
    private readonly IDiagramImageRenderer _diagramImageRenderer = diagramImageRenderer ?? throw new ArgumentNullException(nameof(diagramImageRenderer));
    private readonly ITenantReportBrandingApplyHelper _reportBrandingApplyHelper =
        reportBrandingApplyHelper ?? throw new ArgumentNullException(nameof(reportBrandingApplyHelper));
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public async Task<byte[]> GenerateDocxAsync(
        ArchitectureAnalysisReport report,
        ConsultingDocxExportBranding? branding = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(report);
        ConsultingDocxTemplateOptions options = optionsProvider.GetOptions();
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantReportBrandingForExport? tenantBranding = await _reportBrandingApplyHelper.ResolveForExportAsync(
            scope.TenantId,
            BrandingDisplayContext.ReportCover,
            apiBaseForLinks: null,
            cancellationToken);

        ConsultingDocxExportBranding effectiveBranding =
            _reportBrandingApplyHelper.MergeConsultingDocxBranding(tenantBranding, branding);

        ArchitectureRunDetail detail = new()
        {
            Run = report.Run,
            Manifest = report.Manifest,
        };
        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken);

        return await ConsultingDocxOpenXmlComposer.GenerateAsync(
            report,
            options,
            diagramImageRenderer,
            logoProvider,
            effectiveBranding,
            careerExportHonesty,
            cancellationToken);
    }
}
