using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-004: AgentRuntime budget trackers must use durable <see cref="ILlmTenantBudgetRepository" />.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmBudgetTrackerArchitectureTests
{
    [Fact]
    public void Daily_tenant_budget_tracker_depends_on_durable_budget_repository()
    {
        AssertTrackerDependsOnBudgetRepository(typeof(LlmDailyTenantBudgetTracker));
    }

    [Fact]
    public void Monthly_tenant_dollar_budget_tracker_depends_on_durable_budget_repository()
    {
        AssertTrackerDependsOnBudgetRepository(typeof(LlmMonthlyTenantDollarBudgetTracker));
    }

    private static void AssertTrackerDependsOnBudgetRepository(Type trackerType)
    {
        ConstructorInfo? ctor = trackerType.GetConstructors(BindingFlags.Instance | BindingFlags.Public).FirstOrDefault();

        ctor.Should().NotBeNull();

        bool hasRepository = ctor!
            .GetParameters()
            .Any(static parameter => parameter.ParameterType == typeof(ILlmTenantBudgetRepository));

        hasRepository.Should().BeTrue(
            "INV-004: {0} must reserve/settle against ILlmTenantBudgetRepository, not process-local counters.",
            trackerType.Name);
    }
}
