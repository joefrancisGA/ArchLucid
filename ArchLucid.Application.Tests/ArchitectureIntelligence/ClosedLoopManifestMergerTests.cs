using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopManifestMergerTests
{
    [Fact]
    public void MergeStrengtheningResult_adds_grounded_recommendations_and_findings()
    {
        ClosedLoopManifestMerger sut = new();
        ManifestDocument manifest = new();

        ClosedLoopReasoningResult result = new()
        {
            Recommendations =
            [
                new ArchitectureRecommendation
                {
                    RecommendationId = "rec-private-link",
                    AffectedRequirementOrQualityAttribute = "Private connectivity",
                    ProposedChange = "Use private endpoints for data plane access.",
                    Problem = "Exposure",
                    Evidence = "Policy",
                    ConsequenceOfInaction = "Leak",
                    ValidationMethod = "Review",
                },
            ],
            ProductFindings =
            [
                new Finding
                {
                    FindingId = "finding-1",
                    Title = "Missing private endpoint",
                    Rationale = "Datastore accepts public network paths.",
                    Severity = FindingSeverity.Critical,
                    Category = "Security",
                    FindingType = "Gap",
                    EngineType = "ClosedLoop",
                },
            ],
        };

        ClosedLoopManifestMergeResult mergeResult =
            sut.MergeStrengtheningResult(manifest, result, architectureRequest: null);

        mergeResult.MergedRecommendationCount.Should().Be(1);
        mergeResult.MergedFindingCount.Should().Be(1);
        manifest.Requirements.Uncovered.Should().ContainSingle(item =>
            item.CoverageStatus == "ClosedLoopStrengthened");
        manifest.UnresolvedIssues.Items.Should().ContainSingle(issue => issue.IssueType == "ClosedLoopFinding");
        manifest.Warnings.Should().ContainSingle(warning => warning.Contains("Closed-loop strengthening merged"));
    }

    [Fact]
    public void MergeStrengtheningResult_merges_publishable_topology_from_model()
    {
        ClosedLoopManifestMerger sut = new();
        ManifestDocument manifest = new();

        ClosedLoopReasoningResult result = new()
        {
            Model = new ArchitectureKnowledgeModel
            {
                ModelId = "model-1",
                TenantId = "tenant-1",
                Elements =
                [
                    new ArchitectureModelElement
                    {
                        ElementId = "svc-1",
                        Kind = ArchitectureElementKind.Component,
                        Name = "Inventory API",
                        Description = "Internal inventory API",
                        LifecycleScope = ArchitectureLifecycleScope.TargetState,
                    },
                ],
            },
        };

        ClosedLoopManifestMergeResult mergeResult =
            sut.MergeStrengtheningResult(manifest, result, architectureRequest: null);

        mergeResult.MergedTopologyServiceCount.Should().Be(1);
        manifest.Topology.Services.Should().ContainSingle(service => service.ServiceName == "Inventory API");
    }

    [Fact]
    public void MergeStrengtheningResult_applies_brief_grounding_before_merge()
    {
        ClosedLoopManifestMerger sut = new();
        ManifestDocument manifest = new();

        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Constraints = ["All traffic must use HTTPS only"],
        };

        ClosedLoopReasoningResult result = new()
        {
            Recommendations =
            [
                new ArchitectureRecommendation
                {
                    RecommendationId = "rec-http",
                    ProposedChange = "Keep http://legacy endpoint for compatibility.",
                    Problem = "Legacy",
                    Evidence = "Survey",
                    ConsequenceOfInaction = "Delay",
                    ValidationMethod = "Review",
                },
            ],
        };

        ClosedLoopManifestMergeResult mergeResult =
            sut.MergeStrengtheningResult(manifest, result, request);

        mergeResult.MergedRecommendationCount.Should().Be(0);
        mergeResult.GroundingDropCount.Should().Be(1);
        manifest.Requirements.Uncovered.Should().BeEmpty();
    }
}
