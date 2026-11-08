using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportOmittedFieldHonestyTests
{
    private static readonly Guid StableReviewId = Guid.Parse("e5555555-5555-5555-5555-555555555555");

    private const string StableRunId = "omitted-field-honesty-run";

    [Fact]
    public async Task Traceability_appendix_always_lists_core_rows_with_not_stored_copy()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = StableReviewId,
            RunId = StableRunId,
            HttpCorrelationId = null,
            ManifestVersion = "   ",
            ExtractorTimestampUtcLabel = null,
            TraceabilityLines = [],
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);
        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.HttpCorrelationIdNotStored);
        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.ManifestVersionNotStored);
        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.ExtractorTimestampNotStored);
    }

    [Fact]
    public async Task Evidence_reviewed_surfaces_missing_detail_and_reference()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = StableReviewId,
            RunId = StableRunId,
            EvidenceReviewed =
            [
                new ArchitectureReviewBoardExportEvidenceItem
                {
                    Title = "Inventory export",
                    Detail = null,
                    Reference = "",
                },
            ],
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);
        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.EvidenceDetailNotStored);
        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.EvidenceReferenceNotStored);
    }

    [Fact]
    public async Task Key_risks_and_decisions_surface_missing_detail()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = StableReviewId,
            RunId = StableRunId,
            KeyRisks =
            [
                new ArchitectureReviewBoardExportRiskRow
                {
                    SeverityLabel = "High",
                    Summary = "Open ingress",
                    Detail = null,
                },
            ],
            ArchitectureDecisions =
            [
                new ArchitectureReviewBoardExportDecisionRow
                {
                    Title = "Use private endpoints",
                    Detail = "",
                    RecordedAtUtcLabel = "2026-01-01T00:00:00Z",
                },
            ],
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);
        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.RiskDetailNotStored);
        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.DecisionDetailNotStored);
    }

    [Fact]
    public async Task System_overview_renders_stored_empty_bullets()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = StableReviewId,
            RunId = StableRunId,
            SystemOverviewBullets = ["Valid bullet", "   "],
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);
        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain("Valid bullet");
        xml.Should().Contain(ArchitectureReviewBoardExportHonestyCopy.OverviewItemStoredEmpty);
    }
}
