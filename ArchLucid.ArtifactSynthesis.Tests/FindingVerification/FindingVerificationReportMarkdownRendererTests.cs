using ArchLucid.ArtifactSynthesis.FindingVerification;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.FindingVerification;

[Trait("Category", "Unit")]
public sealed class FindingVerificationReportMarkdownRendererTests
{
    [Fact]
    public void Render_includes_confirmed_rate_and_finding_rows()
    {
        Guid reportId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        FindingVerificationReportDocumentModel model = new()
        {
            ReportId = reportId,
            RunId = runId,
            SourceManifestHash = "sha256-sealed",
            ReportHash = "sha256-report",
            CreatedUtc = new DateTime(2026, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            Summary = new FindingVerificationReportConfirmedRateSummary
            {
                TotalResults = 2,
                MaterializedCount = 1,
                MitigatedCount = 1,
                NotObservedCount = 0,
                NotVerifiableCount = 0,
                VerifiableDenominator = 2,
                ConfirmedNumerator = 2,
                ConfirmedRate = 1.0,
            },
            Findings =
            [
                new FindingVerificationReportFindingRow
                {
                    FindingId = "finding-a",
                    Title = "Public storage",
                    Severity = "Critical",
                    Status = "Materialized",
                    TraceText = "RV-003 matched",
                },
            ],
        };

        string markdown = FindingVerificationReportMarkdownRenderer.Render(model);

        markdown.Should().Contain("Finding verification report");
        markdown.Should().Contain(runId.ToString("D"));
        markdown.Should().Contain("100.0 %");
        markdown.Should().Contain("finding-a");
        markdown.Should().Contain("RV-003 matched");
    }
}
