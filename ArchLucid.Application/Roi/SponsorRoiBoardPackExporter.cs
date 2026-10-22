using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <inheritdoc cref="ISponsorRoiBoardPackExporter" />
public sealed class SponsorRoiBoardPackExporter(
    ISponsorRoiSummaryService SponsorRoiSummaryService,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeProvider,
    SponsorRoiBoardPackPdfBuilder pdfBuilder,
    SponsorRoiBoardPackNarrativeBuilder narrativeBuilder,
    IOptionsMonitor<RoiBoardPackNarrativeOptions> narrativeOptions,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : ISponsorRoiBoardPackExporter
{
    private readonly ISponsorRoiSummaryService _SponsorRoiSummaryService =
        SponsorRoiSummaryService ?? throw new ArgumentNullException(nameof(SponsorRoiSummaryService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly SponsorRoiBoardPackPdfBuilder _pdfBuilder =
        pdfBuilder ?? throw new ArgumentNullException(nameof(pdfBuilder));

    private readonly SponsorRoiBoardPackNarrativeBuilder _narrativeBuilder =
        narrativeBuilder ?? throw new ArgumentNullException(nameof(narrativeBuilder));

    private readonly IOptionsMonitor<RoiBoardPackNarrativeOptions> _narrativeOptions =
        narrativeOptions ?? throw new ArgumentNullException(nameof(narrativeOptions));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    /// <inheritdoc />
    public async Task<SponsorRoiBoardPackExportResult> ExportAsync(
        SponsorRoiBoardPackFormat format,
        string? traceId,
        bool generateNarrative = false,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        SponsorRoiSummaryResponse summary =
            await _SponsorRoiSummaryService.BuildAsync(cancellationToken).ConfigureAwait(false);

        await SponsorRoiBoardPackSealedManifestGuard.EnsureSummaryRunsSealedOrThrowAsync(
            summary,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);

        string tenantName = await ResolveTenantDisplayNameAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        DateTime generatedUtc = TimeProvider.System.UtcNowDateTime();
        string markdown = SponsorRoiBoardPackMarkdownBuilder.Build(tenantName, generatedUtc, summary, traceId);

        if (generateNarrative && _narrativeOptions.CurrentValue.GenerateBoardPackNarrative)
        {
            string? narrative = await _narrativeBuilder.TryBuildNarrativeAsync(summary, cancellationToken).ConfigureAwait(false);
            markdown = SponsorRoiBoardPackNarrativeBuilder.PrefixMarkdown(markdown, narrative);
        }

        if (format == SponsorRoiBoardPackFormat.Pdf)
        {
            byte[] pdf = _pdfBuilder.Build(markdown);

            return new SponsorRoiBoardPackExportResult
            {
                Format = SponsorRoiBoardPackFormat.Pdf,
                ContentType = "application/pdf",
                FileName = "sponsor-roi-board-pack.pdf",
                FileBytes = pdf,
            };
        }

        return new SponsorRoiBoardPackExportResult
        {
            Format = SponsorRoiBoardPackFormat.Markdown,
            ContentType = "text/markdown; charset=utf-8",
            FileName = "sponsor-roi-board-pack.md",
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
