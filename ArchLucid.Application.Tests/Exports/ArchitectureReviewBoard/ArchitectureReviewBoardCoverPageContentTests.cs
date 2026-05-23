using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardCoverPageContentTests
{
    [Fact]
    public void Resolve_formats_generated_on_label_with_long_date()
    {
        DateTimeOffset exportUtc = new(2026, 5, 22, 14, 30, 0, TimeSpan.Zero);

        ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
            new ArchitectureReviewBoardExportDocumentModel { RunId = "run-1", SystemName = "Payments" },
            whitelabel: null,
            exportUtc,
            activeTrialExportNotice: null);

        cover.GeneratedOnLabel.Should().Be("Generated on May 22, 2026 UTC");
    }

    [Fact]
    public void Resolve_includes_prepared_for_when_tenant_display_name_set()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            RunId = "run-1",
            SystemName = "Payments",
            TenantDisplayName = "Contoso Retail"
        };

        ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
            model,
            whitelabel: null,
            new DateTimeOffset(2026, 5, 22, 0, 0, 0, TimeSpan.Zero),
            activeTrialExportNotice: null);

        cover.PreparedForTenantName.Should().Be("Contoso Retail");
    }

    [Fact]
    public void Resolve_whitelabel_uses_firm_title_and_engagement_subtitle()
    {
        WhitelabelConfiguration whitelabel = new()
        {
            FirmDisplayName = "Northwind Partners",
            ClientEngagementTitle = "ARB — Core ledger"
        };

        ArchitectureReviewBoardCoverPageContent cover = ArchitectureReviewBoardCoverPageContent.Resolve(
            new ArchitectureReviewBoardExportDocumentModel { RunId = "run-1" },
            whitelabel,
            new DateTimeOffset(2026, 5, 22, 0, 0, 0, TimeSpan.Zero),
            activeTrialExportNotice: null);

        cover.Title.Should().Be("Northwind Partners");
        cover.Subtitle.Should().Be("ARB — Core ledger");
    }
}
