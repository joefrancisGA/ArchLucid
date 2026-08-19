using System.Reflection;

using ArchLucid.Application.Billing;
using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-004: tenant LLM reporting must route through durable budget repositories, not ad-hoc static trackers.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LlmCostGuardrailArchitectureTests
{
    [Fact]
    public void Tenant_llm_cost_reporting_service_depends_on_top_run_ranker_and_budget_repository()
    {
        Type serviceType = typeof(TenantLlmCostReportingService);
        ConstructorInfo? ctor = serviceType.GetConstructors(BindingFlags.Instance | BindingFlags.Public).FirstOrDefault();

        ctor.Should().NotBeNull();

        HashSet<Type> parameterTypes = ctor!
            .GetParameters()
            .Select(static parameter => parameter.ParameterType)
            .ToHashSet();

        parameterTypes.Should().Contain(typeof(ITenantLlmCostTopRunRanker));
        parameterTypes.Should().Contain(typeof(ILlmTenantBudgetRepository));
    }

    [Fact]
    public void Tenant_llm_cost_top_run_ranker_depends_on_trace_repository_for_per_run_estimates()
    {
        Type rankerType = typeof(TenantLlmCostTopRunRanker);
        ConstructorInfo? ctor = rankerType.GetConstructors(BindingFlags.Instance | BindingFlags.Public).FirstOrDefault();

        ctor.Should().NotBeNull();

        bool referencesTraceRepository = ctor!
            .GetParameters()
            .Any(static parameter => parameter.ParameterType.Name.Contains("IAgentExecutionTraceRepository", StringComparison.Ordinal));

        referencesTraceRepository.Should().BeTrue(
            "INV-004 per-run LLM cost ranking must aggregate persisted execution traces, not ephemeral counters.");
    }
}
