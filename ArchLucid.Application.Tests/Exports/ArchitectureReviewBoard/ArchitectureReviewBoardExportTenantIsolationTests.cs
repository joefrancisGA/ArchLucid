using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

/// <summary>
///     Ensures consultant branding overlays yield distinct artifacts per tenant configuration (DOCX asserts XML markers; PDF asserts byte drift + wire baseline because streams are compressed).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportTenantIsolationTests
{
    private static readonly byte[] MinimalLogo =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    [Fact]
    public async Task Docx_for_tenant_B_does_not_contain_tenant_A_firm_markers()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        const string tenantAFirm = "ZZZ_ISO_MARK_TENANT_ALPHA__7711";

        WhitelabelConfiguration tenantA = new()
        {
            FirmDisplayName = tenantAFirm,
            ClientEngagementTitle = "Engagement Alpha"
        };

        WhitelabelConfiguration tenantB = new()
        {
            FirmDisplayName = "ZZZ_ISO_MARK_TENANT_BRAVO__8822",
            ClientEngagementTitle = "Engagement Bravo"
        };

        ArchitectureReviewDocxBuilder sut = new();

        byte[] bytesA = await sut.BuildAsync(model, tenantA, MinimalLogo, CancellationToken.None);
        byte[] bytesB = await sut.BuildAsync(model, tenantB, MinimalLogo, CancellationToken.None);

        bytesA.Should().NotBeEquivalentTo(bytesB);

        string xmlB = ArchitectureReviewBoardDocxTestHelpers.ExtractMainDocumentXml(bytesB);

        xmlB.Should().NotContain(tenantAFirm);
        xmlB.Should().Contain("ZZZ_ISO_MARK_TENANT_BRAVO__8822");
    }

    [Fact]
    public async Task Pdf_branding_variants_produce_distinct_wire_payloads_for_same_seed_model()
    {
        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportTestModels.CreateFullyPopulatedModel();

        const string tenantAFirm = "ZZZ_ISO_MARK_TENANT_ALPHA_PDF__9933";

        WhitelabelConfiguration tenantA = new()
        {
            FirmDisplayName = tenantAFirm,
            ClientEngagementTitle = "Engagement Alpha Pdf"
        };

        WhitelabelConfiguration tenantB = new()
        {
            FirmDisplayName = "ZZZ_ISO_MARK_TENANT_BRAVO_PDF__9944",
            ClientEngagementTitle = "Engagement Bravo Pdf"
        };

        ArchitectureReviewPdfBuilder sut = new();

        byte[] pdfA = await sut.BuildAsync(model, tenantA, MinimalLogo, cancellationToken: CancellationToken.None);
        byte[] pdfB = await sut.BuildAsync(model, tenantB, MinimalLogo, cancellationToken: CancellationToken.None);

        pdfA.Should().NotBeEquivalentTo(pdfB);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(pdfA);

        ArchitectureReviewBoardPdfTestHelpers.AssertPdfWireBaseline(pdfB);
    }
}
