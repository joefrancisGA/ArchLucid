using ArchLucid.Core.Agents;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInspectReadRepositoryCoreTests
{
    [Fact]
    public void ResolveRuleFields_prefers_applied_rule_ids_json()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[\"rule-1\"]",
            "trace-text");

        ruleId.Should().Be("rule-1");
        ruleName.Should().Be("rule-1");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningPilotSignalRepositoryCoreTests
{
    [Fact]
    public void ClampListTake_caps_at_500()
    {
        ProductLearningPilotSignalRepositoryCore.ClampListTake(10_000).Should().Be(500);
    }

    [Fact]
    public void ValidateInsert_requires_subject_type()
    {
        Action act = () => ProductLearningPilotSignalRepositoryCore.ValidateInsert(
            new ArchLucid.Contracts.ProductLearning.ProductLearningPilotSignalRecord
            {
                SubjectType = " ",
                Disposition = "trusted",
            });

        act.Should().Throw<ArgumentException>();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CompositeAlertRuleRepositoryCoreTests
{
    [Fact]
    public void CloneRule_copies_conditions()
    {
        CompositeAlertRule source = new()
        {
            CompositeRuleId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Name = "rule",
            Severity = "high",
            Operator = "and",
            Conditions =
            [
                new AlertRuleCondition
                {
                    ConditionId = Guid.NewGuid(),
                    MetricType = "cpu",
                    Operator = ">",
                    ThresholdValue = 1m,
                },
            ],
        };

        CompositeAlertRule clone = CompositeAlertRuleRepositoryCore.CloneRule(source);
        clone.Conditions.Should().ContainSingle();
        clone.Conditions[0].MetricType.Should().Be("cpu");
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoverageAssignmentRepositoryCoreTests
{
    [Fact]
    public void FilterByRunId_matches_run_id()
    {
        CoverageAssignment row = new()
        {
            CoverageAssignmentId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = "run-a",
            PolicyPackId = Guid.NewGuid(),
            PolicyPackVersion = "1",
            CoverageType = ArchLucid.Contracts.Governance.Coverage.CoverageType.ProviderNeutralBaseline,
            SelectionState = ArchLucid.Contracts.Governance.Coverage.CoverageSelectionState.Selected,
            ActorUserId = "user",
            CreatedUtc = DateTime.UtcNow,
            EvaluationVersion = "v1",
        };

        CoverageAssignmentRepositoryCore.FilterByRunId([row], "run-a").Should().ContainSingle();
        CoverageAssignmentRepositoryCore.FilterByRunId([row], "run-b").Should().BeEmpty();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentModelCatalogRepositoryCoreTests
{
    [Fact]
    public void Clone_copies_evaluations()
    {
        AgentModelCatalogRow source = new()
        {
            AliasId = "alias-1",
            ProviderConnectionKind = "azure-openai",
            Evaluations =
            [
                new AgentModelCatalogEvaluationRow
                {
                    TaskType = "summarize",
                    EvaluationState = AgentModelEvaluationStateKind.Passed,
                },
            ],
        };

        AgentModelCatalogRow clone = AgentModelCatalogRepositoryCore.Clone(source);
        clone.Evaluations.Should().ContainSingle();
        clone.Evaluations[0].TaskType.Should().Be("summarize");
    }
}
