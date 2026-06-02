using System.Reflection;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-012: API consumers may read gate configuration or aggregate on-demand diagnostics, but must not become
///     second execution-time evaluators outside allow-listed controllers.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateApiConsumerArchitectureTests
{
    private static readonly Type[] AllowedQualityGateInjectionTypes =
    [
        typeof(RunAgentEvaluationController),
    ];

    private static readonly Type[] AllowedQualityGateOptionsInjectionTypes =
    [
        typeof(AdminQualityGateDiagnosticsController),
    ];

    [Fact]
    public void ArchLucid_Api_may_inject_quality_gate_evaluator_only_on_allow_listed_diagnostic_controller()
    {
        Assembly api = typeof(RunAgentEvaluationController).Assembly;
        Type gateInterface = typeof(IAgentOutputQualityGate);

        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (!type.IsClass || type.IsAbstract)
                continue;

            foreach (ConstructorInfo ctor in type.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                foreach (ParameterInfo parameter in ctor.GetParameters())
                {
                    if (parameter.ParameterType != gateInterface)
                        continue;

                    if (AllowedQualityGateInjectionTypes.Contains(type))
                        continue;

                    violations.Add($"{type.FullName}({parameter.Name})");
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-012: only RunAgentEvaluationController may inject IAgentOutputQualityGate in ArchLucid.Api: "
            + string.Join("; ", violations));
    }

    [Fact]
    public void ArchLucid_Api_may_inject_quality_gate_options_only_on_allow_listed_diagnostics_controller()
    {
        Assembly api = typeof(AdminQualityGateDiagnosticsController).Assembly;
        Type optionsMonitor = typeof(IOptionsMonitor<AgentOutputQualityGateOptions>);

        List<string> violations = [];

        foreach (Type type in api.GetTypes())
        {
            if (!type.IsClass || type.IsAbstract)
                continue;

            foreach (ConstructorInfo ctor in type.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic))
            {
                foreach (ParameterInfo parameter in ctor.GetParameters())
                {
                    if (parameter.ParameterType != optionsMonitor)
                        continue;

                    if (AllowedQualityGateOptionsInjectionTypes.Contains(type))
                        continue;

                    violations.Add($"{type.FullName}({parameter.Name})");
                }
            }
        }

        violations.Should().BeEmpty(
            "INV-012: threshold options belong to orchestration/resolvers; Api diagnostics allow-list only: "
            + string.Join("; ", violations));
    }
}
