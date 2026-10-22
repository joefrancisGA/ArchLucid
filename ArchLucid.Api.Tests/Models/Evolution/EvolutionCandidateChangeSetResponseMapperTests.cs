using ArchLucid.Api.Models.Evolution;
using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Models.Evolution;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EvolutionCandidateChangeSetResponseMapperTests
{
    [Fact]
    public void ToResponse_maps_candidate_change_set_record_fields()
    {
        DateTime createdUtc = new(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc);
        Guid changeSetId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid sourcePlanId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        EvolutionCandidateChangeSetRecord record = new()
        {
            CandidateChangeSetId = changeSetId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SourcePlanId = sourcePlanId,
            Status = EvolutionCandidateChangeSetStatusValues.PendingHumanReview,
            Title = "Title",
            Summary = "Summary",
            DerivationRuleVersion = "60R-v2",
            CreatedUtc = createdUtc,
            CreatedByUserId = "user-1",
        };

        EvolutionCandidateChangeSetResponse response = record.ToResponse();

        response.CandidateChangeSetId.Should().Be(changeSetId);
        response.SourcePlanId.Should().Be(sourcePlanId);
        response.Status.Should().Be(record.Status);
        response.Title.Should().Be(record.Title);
        response.Summary.Should().Be(record.Summary);
        response.DerivationRuleVersion.Should().Be(record.DerivationRuleVersion);
        response.CreatedUtc.Should().Be(createdUtc);
        response.CreatedByUserId.Should().Be(record.CreatedByUserId);
    }

    [Fact]
    public void ToResponse_maps_simulation_run_record_fields()
    {
        DateTime completedUtc = new(2026, 7, 2, 8, 30, 0, DateTimeKind.Utc);
        Guid simulationRunId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        EvolutionSimulationRunRecord record = new()
        {
            SimulationRunId = simulationRunId,
            CandidateChangeSetId = Guid.NewGuid(),
            BaselineArchitectureRunId = "baseline-run",
            EvaluationMode = EvolutionEvaluationModeValues.ReadOnlyArchitectureAnalysis,
            OutcomeJson = "{\"ok\":true}",
            WarningsJson = "[\"warn\"]",
            CompletedUtc = completedUtc,
            IsShadowOnly = false,
        };

        EvolutionSimulationRunResponse response = record.ToResponse();

        response.SimulationRunId.Should().Be(simulationRunId);
        response.BaselineArchitectureRunId.Should().Be(record.BaselineArchitectureRunId);
        response.EvaluationMode.Should().Be(record.EvaluationMode);
        response.OutcomeJson.Should().Be(record.OutcomeJson);
        response.WarningsJson.Should().Be(record.WarningsJson);
        response.CompletedUtc.Should().Be(completedUtc);
        response.IsShadowOnly.Should().BeFalse();
    }
}
