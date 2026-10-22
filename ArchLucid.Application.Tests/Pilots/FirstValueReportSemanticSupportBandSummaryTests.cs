using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class FirstValueReportSemanticSupportBandSummaryTests
{
    [Fact]
    public void CountDecisionGradeSemanticSupportBands_counts_decision_grade_only()
    {
        List<ArchitectureFinding> findings =
        [
            CreateFinding("f-1", FindingSemanticSupportBand.Supported),
            CreateFinding("f-2", FindingSemanticSupportBand.Unchecked),
            CreateFinding(
                "f-3",
                FindingSemanticSupportBand.Unsupported,
                classification: FindingClassification.DecisionGradeFinding),
            CreateFinding(
                "f-4",
                FindingSemanticSupportBand.Unsupported,
                classification: FindingClassification.ChecklistCoverage),
        ];

        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts =
            FirstValueReportSemanticSupportBandSummary.CountDecisionGradeSemanticSupportBands(findings);

        counts.Supported.Should().Be(1);
        counts.Unchecked.Should().Be(1);
        counts.Unsupported.Should().Be(1);
        counts.DecisionGradeTotal.Should().Be(3);
    }

    [Fact]
    public void FormatStampSemanticSupportBandLine_includes_unsupported_count()
    {
        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts = new(
            Supported: 1,
            Unchecked: 1,
            Unsupported: 1,
            NotScored: 0,
            DecisionGradeTotal: 3);

        string? line = FirstValueReportSemanticSupportBandSummary.FormatStampSemanticSupportBandLine(counts);

        line.Should().Be("Semantic support (decision-grade): 1 Supported · 1 Unchecked · 1 Unsupported");
    }

    [Fact]
    public void ListUnsupportedDecisionGradeSemanticSupportFindings_lists_only_unsupported_decision_grade()
    {
        List<ArchitectureFinding> findings =
        [
            CreateFinding(
                "bad-1",
                FindingSemanticSupportBand.Unsupported,
                message: "Public database ingress"),
            CreateFinding(
                "ok-1",
                FindingSemanticSupportBand.Supported,
                message: "Supported claim"),
            CreateFinding(
                "check-1",
                FindingSemanticSupportBand.Unsupported,
                message: "Checklist only",
                classification: FindingClassification.ChecklistCoverage),
        ];

        IReadOnlyList<FirstValueReportSemanticSupportBandSummary.UnsupportedSemanticSupportStampEntry> entries =
            FirstValueReportSemanticSupportBandSummary.ListUnsupportedDecisionGradeSemanticSupportFindings(findings);

        entries.Should().ContainSingle();
        entries[0].FindingId.Should().Be("bad-1");
        entries[0].Title.Should().Be("Public database ingress");
    }

    [Fact]
    public void StampSemanticSupportShowsAllClear_is_false_when_unsupported_present()
    {
        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts = new(
            Supported: 0,
            Unchecked: 0,
            Unsupported: 1,
            NotScored: 0,
            DecisionGradeTotal: 1);

        FirstValueReportSemanticSupportBandSummary.StampSemanticSupportShowsAllClear(counts).Should().BeFalse();
    }

    private static ArchitectureFinding CreateFinding(
        string findingId,
        FindingSemanticSupportBand band,
        string message = "sample",
        FindingClassification? classification = null)
    {
        return new ArchitectureFinding
        {
            FindingId = findingId,
            Message = message,
            SemanticSupportBand = band,
            Classification = classification,
            Severity = FindingSeverity.Error,
        };
    }
}
