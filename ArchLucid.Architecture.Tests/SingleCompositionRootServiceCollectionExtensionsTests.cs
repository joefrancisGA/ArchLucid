using System.Reflection;

using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Validation;
using ArchLucid.KnowledgeGraph.Services;
using ArchLucid.Notifications;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-006: domain assemblies must not declare DI registration entry points; composition lives in Host.Composition.</summary>
[Trait("Suite", "Architecture")]
public sealed class SingleCompositionRootServiceCollectionExtensionsTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Scanned_product_assemblies_match_named_composition_root_constants()
    {
        string[] expected = SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames;
        Assembly[] anchors = ResolveCompositionRootScannedProductAnchors();
        string[] actual = anchors.Select(static assembly => assembly.GetName().Name!).ToArray();

        actual.Should().Equal(expected, "update anchors or CompositionRootScannedProductAssemblyNames together");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Scanned_product_assemblies_must_not_expose_public_static_IServiceCollection_entrypoints()
    {
        List<string> violations = [];

        foreach (Assembly assembly in ResolveCompositionRootScannedProductAnchors())
        {
            foreach (Type type in assembly.GetExportedTypes())
            {
                if (!type.IsClass)
                    continue;

                foreach (MethodInfo method in type.GetMethods(
                             BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly))
                {
                    if (method.IsSpecialName)
                        continue;

                    if (!MethodAcceptsServiceCollectionParameter(method))
                        continue;

                    violations.Add($"{assembly.GetName().Name}::{type.FullName}.{method.Name}");
                }
            }
        }

        violations.Should()
            .BeEmpty(
                "INV-006: move IServiceCollection registration helpers to "
                + $"{string.Join(", ", SingleCompositionRootArchitectureTestConstants.ServiceCollectionExtensionAllowListedAssemblyNames)}. "
                + "Violations: "
                + string.Join(Environment.NewLine, violations));
    }

    private static bool MethodAcceptsServiceCollectionParameter(MethodInfo method)
    {
        ParameterInfo[] parameters = method.GetParameters();

        foreach (ParameterInfo parameter in parameters)
        {
            if (typeof(IServiceCollection).IsAssignableFrom(parameter.ParameterType))
                return true;
        }

        return false;
    }

    private static Assembly[] ResolveCompositionRootScannedProductAnchors() =>
    [
        typeof(ArchitectureRunCreateOrchestrator).Assembly,
        typeof(SchemaValidationService).Assembly,
        typeof(LlmCompletionResponseCache).Assembly,
        typeof(DapperPilotReportCardMetricsReader).Assembly,
        typeof(IntegrationEventTypes).Assembly,
        typeof(KnowledgeGraphService).Assembly,
        typeof(DecisionProvenanceGraph).Assembly,
        typeof(RetrievalDocument).Assembly,
        typeof(CanonicalObject).Assembly,
        typeof(ArtifactSynthesisService).Assembly,
        typeof(WebhookPostOptions).Assembly,
    ];
}
