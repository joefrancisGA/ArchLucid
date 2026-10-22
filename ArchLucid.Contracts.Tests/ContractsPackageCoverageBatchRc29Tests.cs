using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>RC29 package-coverage batch: agent dispatch keys, manifest fingerprint, and lightly-covered DTO shells.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc29Tests
{
    private static readonly DateTime SampleUtc = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);
    [Theory]
    [InlineData(AgentType.Topology, AgentTypeKeys.Topology)]
    [InlineData(AgentType.Cost, AgentTypeKeys.Cost)]
    [InlineData(AgentType.Compliance, AgentTypeKeys.Compliance)]
    [InlineData(AgentType.Critic, AgentTypeKeys.Critic)]
    public void AgentTypeKeys_FromEnum_maps_built_in_types(AgentType agentType, string expectedKey)
    {
        AgentTypeKeys.FromEnum(agentType).Should().Be(expectedKey);
    }

    [Fact]
    public void AgentTypeKeys_ResolveDispatchKey_prefers_explicit_agent_type_key()
    {
        AgentTask task = new()
        {
            AgentType = AgentType.Topology,
            AgentTypeKey = "custom-plugin"
        };

        AgentTypeKeys.ResolveDispatchKey(task).Should().Be("custom-plugin");
    }

    [Theory]
    [InlineData(AgentTypeKeys.Topology, AgentType.Topology)]
    [InlineData("COST", AgentType.Cost)]
    [InlineData("unknown", null)]
    public void AgentTypeKeys_TryMapToEnum_resolves_known_keys(string key, AgentType? expected)
    {
        AgentTypeKeys.TryMapToEnum(key).Should().Be(expected);
    }

    [Fact]
    public void AgentTypeKeys_CompareDispatchKeys_is_case_insensitive()
    {
        AgentTypeKeys.CompareDispatchKeys("cost", "Topology").Should().BeLessThan(0);
        AgentTypeKeys.CompareDispatchKeys("topology", "Topology").Should().Be(0);
    }

    [Fact]
    public void GoldenManifestFingerprint_compute_hashes_are_stable_for_same_manifest()
    {
        GoldenManifest manifest = new()
        {
            SystemName = "Harness",
            Metadata = new ManifestMetadata { ManifestVersion = "v1" },
            Governance = new ManifestGovernance()
        };

        string fullHash = GoldenManifestFingerprint.ComputeSha256Hex(manifest);
        string contentHash = GoldenManifestFingerprint.ComputeContentSha256Hex(manifest);

        fullHash.Should().NotBeNullOrWhiteSpace();
        contentHash.Should().NotBeNullOrWhiteSpace();
        GoldenManifestFingerprint.ComputeSha256Hex(manifest).Should().Be(fullHash);
        GoldenManifestFingerprint.ComputeContentSha256Hex(manifest).Should().Be(contentHash);
    }

    [Fact]
    public void AgentOutputEvaluationSummary_and_related_dtos_accept_property_assignments()
    {
        AgentOutputEvaluationSummary summary = new()
        {
            RunId = "run-1",
            EvaluatedAtUtc = SampleUtc,
            AdvisoryCurrent = new AgentOutputEvaluationPerspective
            {
                Authority = "advisoryCurrent",
                Scores = [new AgentOutputEvaluationScore { AgentType = AgentType.Topology, StructuralCompletenessRatio = 0.9 }]
            }
        };

        SimulationEvaluationOptions options = new()
        {
            InvokeLiveDeterminismCheck = true,
            BaselineArchitectureRunIdForDeterminism = "baseline-run",
            DeterminismIterations = 4
        };

        summary.AdvisoryCurrent.Scores.Should().ContainSingle();
        options.DeterminismIterations.Should().Be(4);
    }

    [Fact]
    public void ProductLearning_and_governance_dto_shells_roundtrip_properties()
    {
        LearningPlanningReportArtifactRef artifactRef = new()
        {
            LinkId = Guid.NewGuid(),
            AuthorityBundleId = Guid.NewGuid(),
            PilotArtifactHint = "pilot-hint"
        };

        ProductLearningDashboardSummaryResponse dashboard = new()
        {
            GeneratedUtc = SampleUtc,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            TotalSignalsInScope = 2,
            TriageQueueItemCount = 1
        };

        GovernanceLineageFindingSummary findingSummary = new()
        {
            FindingId = "finding-1",
            Title = "Gap",
            Severity = "High"
        };

        artifactRef.PilotArtifactHint.Should().Be("pilot-hint");
        dashboard.TotalSignalsInScope.Should().Be(2);
        findingSummary.Title.Should().Be("Gap");
    }
}
