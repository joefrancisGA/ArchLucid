using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultRollupProjectionTests
{
    [Fact]
    public void StripHeavyFields_clears_reasoning_topology_and_finding_forensics()
    {
        AgentResult result = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = Guid.NewGuid().ToString("N"),
            AgentType = AgentType.Topology,
            Claims = ["claim-a"],
            EvidenceRefs = ["ev-1"],
            ReasoningTrace = "long reasoning",
            Citations = [new Citation { SourceId = "src-1", Description = "c1" }],
            ChecklistCoverage = [new ArchitectureFinding { Message = "hygiene" }],
            DegradationReasonCode = "degraded",
            ProposedChanges = new AgentTopologyProposal
            {
                RequiredControls = ["ctrl-1"],
                Warnings = ["warn-1"],
                AddedServices = [new ManifestService { ServiceName = "svc" }],
                AddedDatastores = [new ManifestDatastore { DatastoreName = "db" }],
                AddedRelationships = [new ManifestRelationship { SourceId = "a", TargetId = "b" }],
            },
            Findings =
            [
                new ArchitectureFinding
                {
                    Message = "gap",
                    Severity = FindingSeverity.Error,
                    IacStub = "resource ...",
                    ReasoningTrace = "finding reason",
                    WhyThisIsNotGeneric = "why",
                    PrincipalArchitectValue = "value",
                    DecisionConsequence = "consequence",
                },
            ],
        };

        AgentResult stripped = AgentResultRollupProjection.StripHeavyFields(result);

        stripped.Claims.Should().ContainSingle("claim-a");
        stripped.EvidenceRefs.Should().ContainSingle("ev-1");
        stripped.ReasoningTrace.Should().BeNull();
        stripped.Citations.Should().BeNull();
        stripped.ChecklistCoverage.Should().BeEmpty();
        stripped.DegradationReasonCode.Should().BeNull();
        stripped.ProposedChanges.Should().NotBeNull();
        stripped.ProposedChanges!.RequiredControls.Should().ContainSingle("ctrl-1");
        stripped.ProposedChanges.Warnings.Should().ContainSingle("warn-1");
        stripped.ProposedChanges.AddedServices.Should().BeEmpty();
        stripped.ProposedChanges.AddedDatastores.Should().BeEmpty();
        stripped.ProposedChanges.AddedRelationships.Should().BeEmpty();
        stripped.Findings.Should().ContainSingle();
        stripped.Findings[0].Message.Should().Be("gap");
        stripped.Findings[0].IacStub.Should().BeNull();
        stripped.Findings[0].ReasoningTrace.Should().BeNull();
        stripped.Findings[0].WhyThisIsNotGeneric.Should().BeNull();
    }
}
