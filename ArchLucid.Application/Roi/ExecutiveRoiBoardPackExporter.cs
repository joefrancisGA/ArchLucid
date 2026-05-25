using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Roi;

/// <inheritdoc cref="IExecutiveRoiBoardPackExporter" />
public sealed class ExecutiveRoiBoardPackExporter(
    IExecutiveRoiSummaryService executiveRoiSummaryService,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    ExecutiveRoiBoardPackPdfBuilder pdfBuilder) : IExecutiveRoiBoardPackExporter
{
    private readonly IExecutiveRoiSummaryService _executiveRoiSummaryService =
        executiveRoiSummaryService ?? throw new ArgumentNullException(nameof(executiveRoiSummaryService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ExecutiveRoiBoardPackPdfBuilder _pdfBuilder =
        pdfBuilder ?? throw new ArgumentNullException(nameof(pdfBuilder));

    /// <inheritdoc />
    public async Task<ExecutiveRoiBoardPackExportResult> ExportAsync(
        ExecutiveRoiBoardPackFormat format,
        string? traceId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ExecutiveRoiSummaryResponse summary =
            await _executiveRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

        string tenantName = await ResolveTenantDisplayNameAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        DateTime generatedUtc = TimeProvider.System.UtcNowDateTime();
        string markdown = ExecutiveRoiBoardPackMarkdownBuilder.Build(tenantName, generatedUtc, summary, traceId);

        if (format == ExecutiveRoiBoardPackFormat.Pdf)
        {
            byte[] pdf = _pdfBuilder.Build(markdown);

            return new ExecutiveRoiBoardPackExportResult
            {
                Format = ExecutiveRoiBoardPackFormat.Pdf,
                ContentType = "application/pdf",
                FileName = "executive-roi-board-pack.pdf",
                FileBytes = pdf,
            };
        }

        return new ExecutiveRoiBoardPackExportResult
        {
            Format = ExecutiveRoiBoardPackFormat.Markdown,
            ContentType = "text/markdown; charset=utf-8",
            FileName = "executive-roi-board-pack.md",
            Markdown = markdown,
        };
    }

    private async Task<string> ResolveTenantDisplayNameAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return "Tenant";

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return string.IsNullOrWhiteSpace(tenant?.Name) ? tenantId.ToString("D") : tenant.Name.Trim();
    }
}
