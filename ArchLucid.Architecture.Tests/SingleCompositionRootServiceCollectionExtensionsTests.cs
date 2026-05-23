using System.Reflection;

using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Capabilities.Cost;
using ArchLucid.ContextIngestion.Services;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Integration;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Integrations.AzureDevOps;
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
        typeof(LlmCompletionResponseCache).Assembly,
        typeof(ArchitectureRunCreateOrchestrator).Assembly,
        typeof(ArtifactSynthesisService).Assembly,
        typeof(CostConstraintFindingEngine).Assembly,
        typeof(ContextIngestionService).Assembly,
        typeof(AgentTaskStatus).Assembly,
        typeof(IntegrationEventTypes).Assembly,
        typeof(SchemaValidationService).Assembly,
        typeof(AzureDevOpsPullRequestDecorator).Assembly,
        typeof(ArchLucid.Integrations.AzureExtractor.HostedAzureExtractorClient).Assembly,
        typeof(KnowledgeGraphService).Assembly,
        typeof(WebhookPostOptions).Assembly,
        typeof(DapperPilotReportCardMetricsReader).Assembly,
        typeof(DecisionProvenanceGraph).Assembly,
        typeof(RetrievalDocument).Assembly,
    ];

    /// <summary>
    ///     Fails when a new product library lands in the Architecture.Tests output without extending
    ///     <see cref="SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames" />.
    /// </summary>
    [Fact]
    [Trait("Category", "Unit")]
    public void Bin_product_dll_coverage_matches_named_composition_root_constants()
    {
        string? dir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

        if (string.IsNullOrWhiteSpace(dir))
        {
            throw new InvalidOperationException("Could not resolve test output directory.");
        }

        string[] dlls = Directory.GetFiles(dir, "ArchLucid.*.dll", SearchOption.TopDirectoryOnly);
        List<string> names = [];

        foreach (string dll in dlls)
        {
            string name = Path.GetFileNameWithoutExtension(dll);

            if (!IsScannableCompositionRootProductAssembly(name))
                continue;

            names.Add(name);
        }

        names.Sort(StringComparer.Ordinal);
        string[] expected = SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames;

        names.Should().Equal(expected, "add the missing product reference to Architecture.Tests and extend constants/anchors");
    }

    private static bool IsScannableCompositionRootProductAssembly(string assemblyName)
    {
        if (!assemblyName.StartsWith("ArchLucid.", StringComparison.Ordinal))
            return false;

        if (assemblyName.EndsWith(".Tests", StringComparison.Ordinal))
            return false;

        string[] excluded =
        [
            "ArchLucid.Architecture.Tests",
            "ArchLucid.Api",
            "ArchLucid.Worker",
            "ArchLucid.Cli",
            "ArchLucid.Host.Core",
            "ArchLucid.Host.Composition",
            "ArchLucid.TestSupport",
            "ArchLucid.Analyzers",
            "ArchLucid.Benchmarks",
            "ArchLucid.Api.Client",
            "ArchLucid.AgentSimulator",
            "ArchLucid.Backfill.Cli",
            "ArchLucid.Jobs.Cli",
            "ArchLucid.Persistence.MigrateVerify",
        ];

        foreach (string ex in excluded)
        {

            if (string.Equals(assemblyName, ex, StringComparison.Ordinal))
                return false;
        }

        return true;
    }
}
