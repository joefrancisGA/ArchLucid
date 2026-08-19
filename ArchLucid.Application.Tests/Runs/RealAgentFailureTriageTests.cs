using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Resilience;

using FluentAssertions;

using Polly.Timeout;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RealAgentFailureTriageCatalogTests
{
    [Fact]
    public void Catalog_covers_all_assessment_required_scenarios_with_operator_steps()
    {
        foreach (string scenarioId in RealAgentFailureTriageScenarioIds.AllRequired)
        {
            RealAgentFailureTriageEntry? entry = RealAgentFailureTriageCatalog.TryGet(scenarioId);

            entry.Should().NotBeNull($"scenario {scenarioId} must exist in catalog");
            entry!.OperatorNextSteps.Should().NotBeEmpty();
            entry.RelatedDocPaths.Should().NotBeEmpty();
        }

        RealAgentFailureTriageCatalog.All.Should().HaveCount(RealAgentFailureTriageScenarioIds.AllRequired.Count);
    }
}

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RealAgentFailureTriageResolverTests
{
    [Fact]
    public void ResolveScenarioId_when_fallback_context_returns_fallback_to_simulator()
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.Unknown,
        };

        RealAgentFailureTriageContext context = new() { RealModeFellBackToSimulator = true };

        string? scenarioId = RealAgentFailureTriageResolver.ResolveScenarioId(summary, context);

        scenarioId.Should().Be(RealAgentFailureTriageScenarioIds.FallbackToSimulator);
    }

    [Theory]
    [InlineData(AgentExecutionFailureClasses.MissingCredentials, RealAgentFailureTriageScenarioIds.MissingCredentials)]
    [InlineData(AgentExecutionFailureClasses.ContentSafety, RealAgentFailureTriageScenarioIds.ContentSafetyRejection)]
    [InlineData(AgentExecutionFailureClasses.Parse, RealAgentFailureTriageScenarioIds.SchemaViolation)]
    [InlineData(AgentExecutionFailureClasses.QualityGate, RealAgentFailureTriageScenarioIds.GroundingInsufficiency)]
    [InlineData(AgentExecutionFailureClasses.Timeout, RealAgentFailureTriageScenarioIds.Timeout)]
    [InlineData(AgentExecutionFailureClasses.CostBudget, RealAgentFailureTriageScenarioIds.BudgetCutoff)]
    [InlineData(AgentExecutionFailureClasses.Quota, RealAgentFailureTriageScenarioIds.BudgetCutoff)]
    public void ResolveScenarioId_maps_failure_class_to_scenario(string failureClass, string expectedScenarioId)
    {
        AgentExecutionFailureSummary summary = new() { FailureClass = failureClass };

        RealAgentFailureTriageResolver.ResolveScenarioId(summary).Should().Be(expectedScenarioId);
    }
}
