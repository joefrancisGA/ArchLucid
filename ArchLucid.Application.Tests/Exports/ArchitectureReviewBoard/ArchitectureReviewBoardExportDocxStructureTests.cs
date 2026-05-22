using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportDocxStructureTests
{
    [Fact]
    public async Task BuildAsync_with_full_section_seed_contains_all_nine_section_headings_in_order()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        IReadOnlyList<string> expected = ArchitectureReviewBoardExportTestModels.LoadGoldenSectionHeadingOrder();

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);

        IReadOnlyList<string> headings = ArchitectureReviewBoardDocxTestHelpers.ExtractSectionHeadingsInOrder(bytes);

        headings.Should().HaveCount(9);
        headings.Should().Equal(expected);
    }

    [Fact]
    public async Task BuildAsync_with_empty_optional_sections_succeeds_and_emits_No_items_recorded_placeholders()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateEmptySectionsModel();

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);

        bytes.Should().NotBeNull();
        bytes.Length.Should().BeGreaterThan(200);

        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain("No executive summary content recorded.");
        xml.Should().Contain("No architecture snapshot overview items recorded.");
        xml.Should().Contain("No evidence items recorded.");
        xml.Should().Contain("No architecture decisions recorded.");
        xml.Should().Contain("No key risks at or above the export threshold recorded.");
        xml.Should().Contain("No policy evaluation results recorded.");
        xml.Should().Contain("No findings pending human disposition recorded.");
        xml.Should().Contain("No traceability references recorded.");
        xml.Should().Contain("No recommended next actions recorded.");
    }

    [Fact]
    public async Task BuildAsync_with_whitelabel_and_png_logo_embeds_image_and_firm_name_on_cover()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        byte[] png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

        WhitelabelConfiguration whitelabel = new()
        {
            FirmDisplayName = "Fabrikam Advisors LLC",
            ClientEngagementTitle = "ARB — Core ledger review"
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel, png, cancellationToken: CancellationToken.None);

        ArchitectureReviewBoardDocxTestHelpers.CountImageParts(bytes).Should().BeGreaterThan(0);

        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain("Fabrikam Advisors LLC");
        xml.Should().Contain("ARB — Core ledger review");
    }

    [Fact]
    public async Task BuildAsync_without_whitelabel_uses_default_cover_title_and_ArchLucid_footer()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);

        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain("Architecture review board packet");
        xml.Should().Contain("Review (run) ID: golden-architecture-review-board-run-001");
        xml.Should().Contain("Generated UTC:");

        ArchitectureReviewDocxBuilder.ResolveFooterText(null).Should().Be("Prepared by ArchLucid");
    }

    [Fact]
    public async Task BuildAsync_full_seed_sections_contain_non_placeholder_body_content()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);

        string xml = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytes);

        xml.Should().Contain("Stable executive summary paragraph for golden exports.");
        xml.Should().Contain("Design memo");
        xml.Should().Contain("ADR-12 Boundary");
        xml.Should().Contain("Latency SLO at risk.");
        xml.Should().Contain("SOC2");
        xml.Should().Contain("Model flagged anomaly.");
        xml.Should().Contain("golden-build-7");
        xml.Should().Contain("Action one for golden seed.");
    }
}
