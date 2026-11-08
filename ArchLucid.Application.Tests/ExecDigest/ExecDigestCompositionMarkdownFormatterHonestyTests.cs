using ArchLucid.Application.ExecDigest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ExecDigest;

[Trait("Category", "Unit")]
public sealed class ExecDigestCompositionMarkdownFormatterHonestyTests
{
    [Fact]
    public void Format_blank_digest_links_use_not_stored_sentences()
    {
        ExecDigestComposition composition = new(
            WeekLabel: "",
            ComplianceDriftMarkdown: null,
            CommittedManifestsInWeek: null,
            TopManifestRuns: [],
            FindingsDeltaSummary: null,
            DashboardUrl: "",
            SponsorValueReportUrl: "  ",
            LatestCommittedRunIdHex: null);

        string markdown = ExecDigestCompositionMarkdownFormatter.Format(composition);

        markdown.Should().Contain("Week label was not stored.");
        markdown.Should().Contain("Dashboard link was not stored.");
        markdown.Should().Contain("Sponsor value link was not stored.");
        markdown.Should().Contain("Committed manifest count was not stored.");
    }
}
