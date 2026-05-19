using System.Reflection;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-012: quality-gate threshold options stay centralized — only orchestration/evaluation entrypoints inject them.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateOptionsInjectionArchitectureTests
{
    private static readonly Type[] AllowedOptionsInjectionTypes =
    [
        typeof(ArchitectureRunExecuteOrchestrator),
        typeof(TenantAgentOutputQualityGateModeService),
        typeof(AgentOutputQualityGateOptionsResolver),
    ];

    [Fact]
    public void ArchLucid_Application_may_inject_quality_gate_options_only_at_allow_listed_orchestration_points()
    {
        Assembly application = typeof(ArchitectureRunExecuteOrchestrator).Assembly;
        Type optionsType = typeof(IOptions<AgentOutputQualityGateOptions>);
        Type monitorType = typeof(IOptionsMonitor<AgentOutputQualityGateOptions>);

        List<string> violations = [];

        foreach (Type type in application.GetTypes())
        {
            if (!type.IsClass || type.IsAbstract)
                continue;

            ConstructorInfo[] constructors =
                type.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

            foreach (ConstructorInfo ctor in constructors)
            {
                foreach (ParameterInfo parameter in ctor.GetParameters())
                {
                    Type parameterType = parameter.ParameterType;

                    if (parameterType == typeof(IAgentOutputQualityGateOptionsResolver))
                        continue;

                    if (parameterType != optionsType && parameterType != monitorType)
                        continue;

                    if (AllowedOptionsInjectionTypes.Contains(type))
                        continue;

                    violations.Add($"{type.FullName}({parameter.ParameterType.Name} {parameter.Name})");
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-012: unexpected IOptions*<AgentOutputQualityGateOptions> constructor injection in ArchLucid.Application: "
            + string.Join("; ", violations));
    }
}
