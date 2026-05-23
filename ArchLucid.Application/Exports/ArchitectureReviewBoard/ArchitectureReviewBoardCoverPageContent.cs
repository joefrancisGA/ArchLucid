using System.Globalization;

using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Resolved executive cover-page copy shared by DOCX and PDF architecture review board exports.
/// </summary>
public sealed record ArchitectureReviewBoardCoverPageContent(
    string Title,
    string? Subtitle,
    string? PreparedForTenantName,
    string GeneratedOnLabel,
    bool IsDemoTenant,
    string? DemoNotice,
    string? ActiveTrialNotice)
{
    internal const string DemoTenantNotice = "Demo tenant — replace before publishing to executives.";

    /// <summary>Logo width in EMUs for OpenXML cover embedding (scaled below full-page width).</summary>
    internal const long DocxLogoWidthEmus = 1_600_000L;

    /// <summary>Logo height in EMUs for OpenXML cover embedding.</summary>
    internal const long DocxLogoHeightEmus = 520_000L;

    /// <summary>Maximum logo width in PDF points for the cover page.</summary>
    internal const float PdfLogoMaxWidthPoints = 180f;

    internal static ArchitectureReviewBoardCoverPageContent Resolve(
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        DateTimeOffset exportTimestampUtc,
        string? activeTrialExportNotice)
    {
        ArgumentNullException.ThrowIfNull(model);

        string title;
        string? subtitle;

        if (whitelabel is not null)
        {
            title = whitelabel.FirmDisplayName.Trim();
            subtitle = whitelabel.ClientEngagementTitle.Trim();
        }
        else
        {
            title = model.IsDemoTenant
                ? "Architecture review board packet (DEMO)"
                : "Architecture review board packet";

            subtitle = string.IsNullOrWhiteSpace(model.SystemName) ? model.RunId.Trim() : model.SystemName.Trim();

            if (model.IsDemoTenant)
                subtitle += " (DEMO)";
        }

        string generatedOnLabel = FormatGeneratedOnLabel(exportTimestampUtc);

        string? preparedFor = string.IsNullOrWhiteSpace(model.TenantDisplayName)
            ? null
            : model.TenantDisplayName.Trim();

        string? trialNotice = string.IsNullOrWhiteSpace(activeTrialExportNotice)
            ? null
            : activeTrialExportNotice.Trim();

        return new ArchitectureReviewBoardCoverPageContent(
            title,
            subtitle,
            preparedFor,
            generatedOnLabel,
            model.IsDemoTenant,
            model.IsDemoTenant ? DemoTenantNotice : null,
            trialNotice);
    }

    internal static string FormatGeneratedOnLabel(DateTimeOffset exportTimestampUtc) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"Generated on {exportTimestampUtc.UtcDateTime:MMMM d, yyyy} UTC");
}
