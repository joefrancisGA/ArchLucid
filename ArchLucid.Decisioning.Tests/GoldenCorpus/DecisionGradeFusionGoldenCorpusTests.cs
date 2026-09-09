using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     DX-51 sibling: merge harness AnalyzeAsync cannot emit fusion (placeholder engine).
///     This fixture feeds pre-classified Decision-grade rows through the post-gate stage.
/// </summary>
[Trait("Suite", "Core")]
public sealed class DecisionGradeFusionGoldenCorpusTests
{
    [Fact]
    public async Task Preferred_decision_grade_rows_sharing_a_node_fuse_without_dropping_constituents()
    {
        List<Finding> members =
        [
            CreateMember("seg-38", "segmentation-semantics", "Internet 3389 on jump box", "nsg-pay"),
            CreateMember("df-47", "data-flow-trust-boundary", "Jump box path to PCI datastore", "nsg-pay"),
        ];

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
            },
            Snapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                Findings = members,
            },
        };

        FindingsDecisionGradeFusionStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot!.Findings.Should().HaveCount(3);
        Finding fusion = context.Snapshot.Findings.Should().ContainSingle(finding =>
            finding.EngineType == DecisionGradeFusionApplicator.EngineType).Subject;

        DecisionGradeFusionFindingPayload payload =
            fusion.Payload.Should().BeOfType<DecisionGradeFusionFindingPayload>().Subject;
        payload.ConstituentFindingIds.Should().BeEquivalentTo(["df-47", "seg-38"]);
        payload.SharedNodeIds.Should().Equal("nsg-pay");
        fusion.Title.Should().Contain("on nsg-pay");
        fusion.Title.Should().NotContain("therefore");
        fusion.Title.Should().NotContain("breach");
        fusion.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        context.Snapshot.Findings.Where(static finding => finding.FindingId is "seg-38" or "df-47")
            .Should()
            .OnlyContain(static finding =>
                finding.Classification == FindingClassification.ChecklistCoverage
                && finding.Treatment == FindingTreatment.DemoteToChecklist);
    }

    private static Finding CreateMember(string findingId, string engineType, string title, string nodeId)
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "TypedEngineFinding",
            Category = "Security",
            EngineType = engineType,
            Severity = FindingSeverity.Warning,
            Title = title,
            Rationale = title,
            Classification = FindingClassification.DecisionGradeFinding,
            RelatedNodeIds = [nodeId],
            EvidenceRefs = [$"doc:{findingId}.md#L1"],
            Trace = new ExplainabilityTrace(),
        };
    }
}
