using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopStrengtheningScoreSyncTests
{
    [Fact]
    public void ProjectSupplementalFindings_maps_closed_loop_requirements_as_coverage_gaps()
    {
        ManifestDocument manifest = new()
        {
            Requirements =
            {
                Uncovered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "Private connectivity",
                        RequirementText = "Use private endpoints for all data plane access.",
                        CoverageStatus = "ClosedLoopStrengthened",
                    },
                ],
            },
        };

        IReadOnlyList<Finding> findings =
            ClosedLoopManifestFindingsProjector.ProjectSupplementalFindings(manifest, existingFindingIds: []);

        findings.Should().ContainSingle();
        FinalizeQualityFindingSignals.IsCoverageGap(findings[0]).Should().BeTrue();
    }

    [Fact]
    public void SyncScoreSignals_mutes_required_capability_finding_when_topology_satisfies_capabilities()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "encryption|private-networking",
                    },
                },
                new GraphNode
                {
                    NodeId = "svc",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Private endpoint gateway",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["encryption"] = "enabled",
                        ["private-networking"] = "enabled",
                    },
                },
            ],
        };

        ManifestDocument manifest = new()
        {
            Topology =
            {
                Services =
                [
                    new ArchLucid.Contracts.Manifest.ManifestService
                    {
                        ServiceId = "svc-1",
                        ServiceName = "Orders API",
                        ServiceType = ArchLucid.Contracts.Common.ServiceType.Api,
                        RuntimePlatform = ArchLucid.Contracts.Common.RuntimePlatform.AppService,
                        Purpose = "encryption private-networking",
                    },
                ],
            },
        };

        FindingsSnapshot findingsSnapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = graph.RunId,
            Findings =
            [
                new Finding
                {
                    FindingId = "req-cap-1",
                    FindingType = "RequiredCapabilityCoverageFinding",
                    Category = "Governance",
                    EngineType = "required-capability-coverage",
                    Severity = FindingSeverity.Warning,
                    Title = "Required capabilities are not fully evidenced on the context graph",
                    Rationale = "Missing capabilities.",
                    PayloadType = nameof(RequiredCapabilityCoverageFindingPayload),
                    Payload = new RequiredCapabilityCoverageFindingPayload
                    {
                        RequiredCapabilities = ["encryption", "private-networking"],
                        MissingCapabilities = ["encryption", "private-networking"],
                    },
                },
            ],
        };

        ClosedLoopStrengtheningScoreSyncService sut = new();
        ClosedLoopStrengtheningScoreSyncResult result =
            sut.SyncScoreSignals(manifest, graph, findingsSnapshot);

        result.MutedRequiredCapabilityFinding.Should().BeTrue();
        findingsSnapshot.Findings.Should().ContainSingle(finding => finding.IsMuted);
        FinalizeQualityFindingSignals.IsOpenRequiredCapabilityCoverageJobView(
            findingsSnapshot.Findings[0],
            latestDisposition: null).Should().BeFalse();
    }
}
