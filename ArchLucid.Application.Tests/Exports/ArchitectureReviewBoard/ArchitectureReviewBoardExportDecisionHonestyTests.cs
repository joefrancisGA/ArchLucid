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

        ArchitectureReviewBoardExportDecisionRow runEventRow =
            model.ArchitectureDecisions!.Single(row => row.Title == "Run event");

        runEventRow.Detail.Should().Contain("Synthetic.CommitGate");
    }
}
