using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class FindingEvidenceLinkageFindingEngineTests
{
    [Fact]
    public void Evaluate_emits_warning_when_high_severity_finding_has_no_evidence_anchor()
    {
        FindingEvidenceLinkageFindingEngine sut = new();
        List<Finding> findings =
        [
            new()
            {
                FindingId = "finding-1",
                FindingType = "SecurityGap",
                Category = "Security",
                EngineType = "SecurityGapFindingEngine",
                Severity = FindingSeverity.Error,
                Title = "Missing encryption",
                Rationale = "Data store lacks encryption at rest.",
            },
        ];

        IReadOnlyList<Finding> linkageFindings = sut.Evaluate("run123", findings);

        linkageFindings.Should().ContainSingle(f => f.FindingType == "EvidenceLinkage");
    }

    [Fact]
    public void Evaluate_skips_findings_with_graph_node_linkage()
    {
        FindingEvidenceLinkageFindingEngine sut = new();
        List<Finding> findings =
        [
            new()
            {
                FindingId = "finding-2",
                FindingType = "SecurityGap",
                Category = "Security",
                EngineType = "SecurityGapFindingEngine",
                Severity = FindingSeverity.Critical,
                Title = "Missing encryption",
                Rationale = "Data store lacks encryption at rest.",
                RelatedNodeIds = ["node-db-1"],
            },
        ];

        IReadOnlyList<Finding> linkageFindings = sut.Evaluate("run123", findings);

        linkageFindings.Should().BeEmpty();
    }

    [Theory]
    [InlineData(FindingSeverity.Warning)]
    [InlineData(FindingSeverity.Info)]
    public void Evaluate_ignores_non_blocking_severities(FindingSeverity severity)
    {
        FindingEvidenceLinkageFindingEngine sut = new();
        List<Finding> findings =
        [
            new()
            {
                FindingId = "finding-3",
                FindingType = "SecurityGap",
                Category = "Security",
                EngineType = "SecurityGapFindingEngine",
                Severity = severity,
                Title = "Advisory note",
                Rationale = "Low priority.",
            },
        ];

        IReadOnlyList<Finding> linkageFindings = sut.Evaluate("run123", findings);

        linkageFindings.Should().BeEmpty();
    }
}
