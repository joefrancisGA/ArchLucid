using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Agent Result Diff Service.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AgentResultDiffServiceTests
{
    [SkippableFact]
    public void Compare_ShouldDetectClaimAndControlChanges()
    {
        AgentResult[] left =
        [
            new()
            {
                ResultId = "R1",
                TaskId = "T1",
                RunId = "RUN-LEFT",
                AgentType = AgentType.Compliance,
                Claims = ["Managed identity required"],
                EvidenceRefs = ["policy-a"],
                Confidence = 0.90,
                ProposedChanges = new AgentTopologyProposal
                {
                    ProposalId = "P1", SourceAgent = AgentType.Compliance, RequiredControls = ["Managed Identity"]
                }
            }
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "R2",
                TaskId = "T2",
                RunId = "RUN-RIGHT",
                AgentType = AgentType.Compliance,
                Claims = ["Managed identity required", "Private endpoints required"],
                EvidenceRefs = ["policy-a", "policy-b"],
                Confidence = 0.95,
                ProposedChanges = new AgentTopologyProposal
                {
                    ProposalId = "P2",
                    SourceAgent = AgentType.Compliance,
                    RequiredControls = ["Managed Identity", "Private Endpoints"]
                }
            }
        ];

        AgentResultDiffService service = new(new CrossReviewFindingCorrelationService());

        AgentResultDiffResult diff = service.Compare("RUN-LEFT", left, "RUN-RIGHT", right);

        diff.AgentDeltas.Should().ContainSingle();
        AgentResultDelta delta = diff.AgentDeltas.Single();

        delta.AgentType.Should().Be(AgentType.Compliance);
        delta.AddedClaims.Should().Contain("Private endpoints required");
        delta.AddedEvidenceRefs.Should().Contain("policy-b");
        delta.AddedRequiredControls.Should().Contain("Private Endpoints");
        delta.LeftConfidence.Should().Be(0.90);
        delta.RightConfidence.Should().Be(0.95);
    }

    [Theory]
    [InlineData("", "finding-1")]
    [InlineData("finding-1", "")]
    public void Compare_ignores_id_only_changes_without_hiding_added_or_removed_findings(string leftId, string rightId)
    {
        AgentResult left = new()
        {
            AgentType = AgentType.Topology,
            Findings =
            [
                new() { FindingId = leftId, Message = "Unchanged finding" },
                new() { FindingId = "removed", Message = "Removed finding" }
            ]
        };
        AgentResult right = new()
        {
            AgentType = AgentType.Topology,
            Findings =
            [
                new() { FindingId = rightId, Message = "Unchanged finding" },
                new() { FindingId = "added", Message = "Added finding" }
            ]
        };
        AgentResultDiffService service = new(new CrossReviewFindingCorrelationService());

        AgentResultDelta delta = service.Compare("left", [left], "right", [right]).AgentDeltas.Single();

        delta.AddedFindings.Should().Equal("Added finding");
        delta.RemovedFindings.Should().Equal("Removed finding");
    }
}
