using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
public sealed class ArchitectureReviewBoardExportDecisionHonestyTests
{
    [Fact]
    public void Create_uses_buyer_facing_decision_trace_titles_and_rule_audit_detail()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();

        RuleAuditTracePayload ruleAudit = new()
        {
            RuleSetId = "baseline",
            RuleSetVersion = "1.0",
            AppliedRuleIds = ["rule-1"],
            AcceptedFindingIds = [],
            RejectedFindingIds = [],
            CreatedUtc = new DateTime(2026, 5, 16, 10, 0, 0, DateTimeKind.Utc),
        };

        detail.DecisionTraces =
        [
            detail.DecisionTraces![0],
            RuleAuditTraceDto.From(ruleAudit),
        ];

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.ArchitectureDecisions.Should().NotBeNull();
        model.ArchitectureDecisions!.Select(row => row.Title).Should().Contain("Run event");
        model.ArchitectureDecisions!.Select(row => row.Title).Should().NotContain("RunEvent");

        ArchitectureReviewBoardExportDecisionRow ruleAuditRow =
            model.ArchitectureDecisions!.Single(row => row.Title == "Rule audit");

        ruleAuditRow.Detail.Should().Contain("Rule set baseline v1.0");
        ruleAuditRow.Detail.Should().Contain("Accepted finding ids were stored empty.");
        ruleAuditRow.Detail.Should().Contain("Rejected finding ids were stored empty.");
        ruleAuditRow.Detail.Should().Contain("Required finding ids were stored empty.");
        ruleAuditRow.RecordedAtUtcLabel.Should().Be("2026-05-16T10:00:00.0000000Z");

        ArchitectureReviewBoardExportDecisionRow runEventRow =
            model.ArchitectureDecisions!.Single(row => row.Title == "Run event");

        runEventRow.Detail.Should().Contain("Synthetic.CommitGate");
        runEventRow.RecordedAtUtcLabel.Should().Be(ArchitectureReviewBoardExportHonestyCopy.DecisionRecordedTimeNotStored);
    }

    [Fact]
    public void Create_rule_audit_uses_stored_empty_label_for_empty_applied_rules()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();

        detail.DecisionTraces =
        [
            RuleAuditTraceDto.From(
                new RuleAuditTracePayload
                {
                    RuleSetId = "baseline",
                    RuleSetVersion = "1.0",
                    AppliedRuleIds = [],
                    AcceptedFindingIds = [],
                    RejectedFindingIds = [],
                }),
        ];

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.ArchitectureDecisions!.Single().Detail.Should().Contain("Applied rules were stored empty.");
    }

    [Fact]
    public void Create_adds_remainder_row_when_decision_traces_exceed_export_cap()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();

        List<DecisionTraceDto> traces = [];

        for (int index = 0; index < 41; index++)
        {
            traces.Add(
                RunEventTraceDto.From(
                    new RunEventTracePayload
                    {
                        EventType = "Synthetic.Test",
                        EventDescription = $"trace-{index}",
                    }));
        }

        detail.DecisionTraces = traces;

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.ArchitectureDecisions.Should().HaveCount(41);
        model.ArchitectureDecisions![^1].Title.Should().Be(ArchitectureReviewBoardExportHonestyCopy.DecisionTracesOmittedTitle);
        model.ArchitectureDecisions![^1].Detail.Should().Contain("1 additional decision traces");
    }
}
