using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeScenarioFactoryEmissionGateTests
{
    [Fact]
    public void ApplyToResults_retains_simulator_findings_after_kind_b_provenance()
    {
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });

        AgentResult[] results =
        [
            FakeScenarioFactory.CreateComplianceResult("run-1", "task-compliance", request),
            FakeScenarioFactory.CreateCostResult("run-1", "task-cost", request),
            FakeScenarioFactory.CreateCriticResult("run-1", "task-critic", request),
            FakeScenarioFactory.CreateTopologyResult("run-1", "task-topology", request),
        ];

        AgentArchitectureFindingEmissionGate.ApplyToResults(results);

        results.SelectMany(static result => result.Findings.Select(static finding => finding.Category))
            .Should()
            .BeEquivalentTo(["Compliance", "Cost", "Critic", "Topology"]);

        results.Should().OnlyContain(static result => result.WithheldFindings.Count == 0);
    }
}
