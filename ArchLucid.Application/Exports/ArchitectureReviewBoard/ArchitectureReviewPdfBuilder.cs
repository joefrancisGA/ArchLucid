using ArchLucid.Application.Rendering;
using ArchLucid.Contracts.Exports;

using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     PDF parity builder for the <c>architecture-review-board</c> export profile using QuestPDF — already consolidated on this MIT/community-licensed,
///     native .NET renderer in <see cref="Rendering.QuestPdfDocumentBytes" /> so DOCX remains OpenXML while PDF mirrors section structure beside pilots/board packs.
/// </summary>
public sealed partial class ArchitectureReviewPdfBuilder
{
    internal const string DemoTenantExportWatermark = "DEMO — NOT A CUSTOMER OUTCOME";

    /// <summary>
    ///     Generates PDF bytes. When <paramref name="logoImageBytes" /> is supplied, renders a cover logo (PNG/JPEG; callers validate via
    ///     <see cref="ArchitectureReviewBoardCoverLogoValidator" />).
    /// </summary>
    public Task<byte[]> BuildAsync(
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        string? activeTrialExportNotice = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(model);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(model.RunId))
            throw new ArgumentException("RunId is required.", nameof(model));

        WhitelabelConfigurationValidator.ValidateIfProvided(whitelabel);

        DateTimeOffset exportTimestampUtc = TimeProvider.System.GetUtcNow();

        string footerText = ArchitectureReviewBoardExportTraceFooter.ComposePageFooterText(
            ArchitectureReviewDocxBuilder.ResolveFooterText(whitelabel),
            model.RunId,
            exportTimestampUtc,
            activeTrialExportNotice);

        byte[] pdf = QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page => ComposeCoverPage(page, model, whitelabel, logoImageBytes, footerText, activeTrialExportNotice, exportTimestampUtc));

            container.Page(page => ComposeDocumentBody(page, model, footerText));
        });

        return Task.FromResult(pdf);
    }

    internal static string ComposePageFooterText(string baseFooter, string? activeTrialExportNotice)
    {
        if (string.IsNullOrWhiteSpace(activeTrialExportNotice))
            return baseFooter;

        return string.IsNullOrWhiteSpace(baseFooter)
            ? activeTrialExportNotice
            : $"{baseFooter} · {activeTrialExportNotice}";
    }
}
