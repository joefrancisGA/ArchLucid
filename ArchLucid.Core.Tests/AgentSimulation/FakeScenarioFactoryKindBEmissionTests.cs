using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentSimulation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeScenarioFactoryKindBEmissionTests
{
    [Fact]
    public void Golden_cohort_request_emits_all_locked_finding_categories_with_kind_b_ids()
    {
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });

        AgentResult compliance = FakeScenarioFactory.CreateComplianceResult("run-1", "task-compliance", request);
        AgentResult cost = FakeScenarioFactory.CreateCostResult("run-1", "task-cost", request);
        AgentResult critic = FakeScenarioFactory.CreateCriticResult("run-1", "task-critic", request);
        AgentResult topology = FakeScenarioFactory.CreateTopologyResult("run-1", "task-topology", request);

        compliance.Findings.Should().ContainSingle(f => f.Category == "Compliance");
        compliance.Findings[0].PolicyRuleId.Should().Be(FakeScenarioFindingKindBProvenance.KeyVaultSecretsRuleId);
        cost.Findings.Should().ContainSingle(f => f.Category == "Cost");
        cost.Findings[0].PolicyRuleId.Should().Be(FakeScenarioFindingKindBProvenance.ManagedServicesCostRuleId);
        critic.Findings.Should().ContainSingle(f => f.Category == "Critic");
        critic.Findings[0].PolicyRuleId.Should().Be(FakeScenarioFindingKindBProvenance.StarterCoherenceRuleId);
        topology.Findings.Should().ContainSingle(f => f.Category == "Topology");
        topology.Findings[0].PolicyRuleId.Should().Be(FakeScenarioFindingKindBProvenance.ManagedServiceTopologyRuleId);

        GoldenCohortFindingCategoryAggregator.DistinctCategories([compliance, cost, critic, topology])
            .Should()
            .Equal("Compliance", "Cost", "Critic", "Topology");
    }
}
