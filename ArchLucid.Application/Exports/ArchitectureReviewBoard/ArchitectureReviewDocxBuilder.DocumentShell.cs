using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public sealed partial class ArchitectureReviewDocxBuilder
{
    /// <summary>
    ///     Generates DOCX bytes. When <paramref name="logoImageBytes" /> is supplied, embeds a cover logo (PNG/JPEG detected by magic bytes).
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
        string footerText = ComposeFooterText(whitelabel, activeTrialExportNotice, model.RunId, exportTimestampUtc);

        MemoryStream stream = new();

        using (WordprocessingDocument document = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document(new Body());
            Body body = mainPart.Document.Body!;

            ArchitectureReviewDocxOpenXmlPrimitives.AddStylesPart(mainPart);

            AddCoverPageSection(mainPart, body, model, whitelabel, logoImageBytes, activeTrialExportNotice, exportTimestampUtc);
            ArchitectureReviewDocxOpenXmlPrimitives.AddPageBreak(body);

            ArchitectureReviewBoardExportSectionVisitor.VisitBodySections((kind, _) =>
                RenderDocxBodySection(body, kind, model));

            ArchitectureReviewDocxOpenXmlPrimitives.AttachDefaultFooter(mainPart, body, footerText);
            mainPart.Document.Save();
        }

        return Task.FromResult(stream.ToArray());
    }

    internal static string ResolveFooterText(WhitelabelConfiguration? whitelabel)
    {
        if (whitelabel is null)
            return "Prepared by ArchLucid";

        return whitelabel.ResolveFooterAttribution();
    }

    internal static string ComposeFooterText(
        WhitelabelConfiguration? whitelabel,
        string? activeTrialExportNotice,
        string runId,
        DateTimeOffset exportTimestampUtc)
    {
        return ArchitectureReviewBoardExportTraceFooter.ComposePageFooterText(
            ResolveFooterText(whitelabel),
            runId,
            exportTimestampUtc,
            activeTrialExportNotice);
    }

    internal void AddCoverPageSection(
        MainDocumentPart mainPart,
        Body body,
        ArchitectureReviewBoardExportDocumentModel model,
        WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes,
        string? activeTrialExportNotice = null,
        DateTimeOffset? exportTimestampUtc = null)
    {
        DateTimeOffset generatedUtc = exportTimestampUtc ?? TimeProvider.System.GetUtcNow();
        ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
            model,
            whitelabel,
            generatedUtc,
            activeTrialExportNotice);

        if (logoImageBytes is { Length: > 0 })
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredImageToBody(
                mainPart,
                body,
                logoImageBytes,
                "Consultant logo",
                ArchitectureReviewBoardCoverPageContent.DocxLogoWidthEmus,
                ArchitectureReviewBoardCoverPageContent.DocxLogoHeightEmus);
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        }
        else
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(
                body,
                ArchitectureReviewBoardCoverPageContent.LogoPlaceholderLabel,
                "Subtle");
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.Title, "DocTitle");

        if (!string.IsNullOrWhiteSpace(cover.Subtitle))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.Subtitle, "DocSubtitle");
        }

        if (!string.IsNullOrWhiteSpace(cover.PreparedForTenantName))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(
                body,
                $"Prepared for {cover.PreparedForTenantName}",
                "BodyText");
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 2);
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.GeneratedOnLabel, "BodyText");
        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(
            body,
            ArchitectureReviewBoardCoverPageContent.DirectionalEstimatesFooter,
            "Subtle");

        if (!string.IsNullOrWhiteSpace(cover.DemoNotice))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.DemoNotice, "Subtle");
        }

        if (!string.IsNullOrWhiteSpace(cover.ActiveTrialNotice))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.ActiveTrialNotice, "Subtle");
        }

        if (!string.IsNullOrWhiteSpace(cover.SimulatorRehearsalTitle))
        {
            ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 1);
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.SimulatorRehearsalTitle, "Subtle");

            if (!string.IsNullOrWhiteSpace(cover.SimulatorRehearsalBody))
                ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, cover.SimulatorRehearsalBody, "Subtle");
        }

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 3);
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, $"Review ID: {model.ReviewId:D}", "Subtle");
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, $"Review (run) ID: {model.RunId.Trim()}",
            "Subtle");

        if (!string.IsNullOrWhiteSpace(model.RequestId))
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body, $"Request ID: {model.RequestId.Trim()}",
                "Subtle");

        if (!string.IsNullOrWhiteSpace(model.ManifestVersion))
            ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(
                body,
                $"Architecture snapshot version: {model.ManifestVersion.Trim()}",
                "Subtle");

        ArchitectureReviewDocxOpenXmlPrimitives.AddSpacer(body, 4);
        ArchitectureReviewDocxOpenXmlPrimitives.AddCenteredStyledParagraph(body,
            "Terminology follows buyer-facing glossary: Review ↔ committed run; Architecture snapshot ↔ golden manifest.",
            "Subtle");
    }

    private void RenderDocxBodySection(
        Body body,
        ArchitectureReviewBoardExportSectionKind kind,
        ArchitectureReviewBoardExportDocumentModel model)
    {
        switch (kind)
        {
            case ArchitectureReviewBoardExportSectionKind.SponsorReport:
                AddSponsorReportSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.SystemOverview:
                AddSystemOverviewSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.EvidenceReviewed:
                AddEvidenceReviewedSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.ArchitectureDecisions:
                AddArchitectureDecisionsSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.KeyRisks:
                AddKeyRisksSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.PolicyFindings:
                AddPolicyFindingsSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.AiAssistedAnalysis:
                AddAiAssistedAnalysisSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.TraceabilityAppendix:
                AddTraceabilityAppendixSection(body, model);
                break;
            case ArchitectureReviewBoardExportSectionKind.RecommendedNextActions:
                AddRecommendedNextActionsSection(body, model);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown export section kind.");
        }
    }
}
