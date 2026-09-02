using ArchLucid.Contracts.Alerts;
using ArchLucid.Persistence.Alerts;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

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
