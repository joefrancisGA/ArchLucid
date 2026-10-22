using ArchLucid.Application.Traceability;
using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Traceability;

[Trait("Suite", "Core")]
public sealed class BuyerSafeAuditEvidenceSummaryBuilderTests
{
    [SkippableFact]
    public void BuildJson_OmitsRawPayloadsAndIncludesEventTypeCounts()
    {
        Guid eventId = Guid.Parse("cccccccccccccccccccccccccccccccc");
        List<AuditEvent> audits =
        [
            new()
            {
                EventId = eventId,
                EventType = AuditEventTypes.ExportDownloadSucceeded,
                ActorUserId = "operator",
                ActorUserName = "Operator",
                DataJson = "{\"secret\":\"must-not-appear\"}",
            },
        ];

        string json = BuyerSafeAuditEvidenceSummaryBuilder.BuildJson("run-1", audits, truncated: false);

        json.Should().Contain(AuditEventTypes.ExportDownloadSucceeded);
        json.Should().Contain(eventId.ToString("D"));
        json.Should().NotContain("must-not-appear");
    }

    [SkippableFact]
    public void BuildMarkdown_ListsBuyerSafeSections()
    {
        string markdown = BuyerSafeAuditEvidenceSummaryBuilder.BuildMarkdown("run-1", [], truncated: false);

        markdown.Should().Contain("# Audit evidence summary");
        markdown.Should().Contain("Omitted from this export");
        markdown.Should().Contain("**Disposition:** **WARN**");
    }
}
