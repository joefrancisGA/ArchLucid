using System.Text.RegularExpressions;

using ArchLucid.Application.Findings;
using ArchLucid.Capabilities.Cost;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Plugins;
using ArchLucid.Decisioning.Services;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Plugins;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuiltInFindingEngineTypeCatalogTests
{
    private static readonly Regex FindingEngineRegistration = new(
        @"AddScoped<\s*(?:Di\.)?I(?:Effectful)?FindingEngine\s*,\s*([^>]+?)\s*>",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    [Fact]
    public void Catalog_EngineTypeIds_match_plugin_discovery_skip_set()
    {
        BuiltInFindingEngineTypeCatalog.EngineTypeIds
            .SetEquals(FindingEnginePluginDiscovery.BuiltInEngineTypeIds)
            .Should()
            .BeTrue(
                because: "plugin skip set must be the catalog EngineType set (ordinal ignore case)");
    }

    [Fact]
    public void Catalog_does_not_include_technology_consistency_engine()
    {
        BuiltInFindingEngineTypeCatalog.EngineTypeIds
            .Contains("TechnologyConsistencyFindingEngine")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void Registered_composition_engine_types_equal_skip_set()
    {
        string compositionPath = Path.Combine(
            LocateRepositoryRoot(),
            "ArchLucid.Host.Composition",
            "Startup",
            "ServiceCollectionExtensions.Decisioning.cs");

        File.Exists(compositionPath).Should().BeTrue(because: "composition root must be readable for the catalog guard");

        string source = File.ReadAllText(compositionPath);
        List<string> registeredSimpleNames = FindingEngineRegistration
            .Matches(source)
            .Select(static match => SimpleTypeName(match.Groups[1].Value))
            .ToList();

        registeredSimpleNames.Should().NotBeEmpty();

        HashSet<string> registeredEngineTypes = new(StringComparer.OrdinalIgnoreCase);
        IReadOnlyDictionary<string, Type> knownTypes = LoadKnownImplementationTypes();

        foreach (string simpleName in registeredSimpleNames)
        {
            BuiltInFindingEngineTypeCatalog.ImplementationTypeNameToEngineType.Should().ContainKey(
                simpleName,
                because: "{0} is registered in composition and must appear in the catalog type map",
                simpleName);

            string expectedEngineType = BuiltInFindingEngineTypeCatalog.ImplementationTypeNameToEngineType[simpleName];

            if (knownTypes.TryGetValue(simpleName, out Type? implementationType)
                && implementationType.GetConstructor(Type.EmptyTypes) is not null)
            {
                object instance = Activator.CreateInstance(implementationType)
                    ?? throw new InvalidOperationException($"Failed to construct {simpleName}.");

                string actualEngineType = ReadEngineType(instance);
                actualEngineType.Should().BeEquivalentTo(
                    expectedEngineType,
                    because: "{0}.EngineType must match the catalog map",
                    simpleName);
            }

            registeredEngineTypes.Add(expectedEngineType);
            FindingEnginePluginDiscovery.BuiltInEngineTypeIds.Should().Contain(
                expectedEngineType,
                because: "every registered EngineType must be in the plugin skip set");
        }

        FindingEnginePluginDiscovery.BuiltInEngineTypeIds.Should().BeEquivalentTo(
            registeredEngineTypes,
            because: "every skip id must be registered as IFindingEngine or IEffectfulFindingEngine");
    }

    private static string ReadEngineType(object instance)
    {
        return instance switch
        {
            IFindingEngine graphPure => graphPure.EngineType,
            IEffectfulFindingEngine effectful => effectful.EngineType,
            _ => throw new InvalidOperationException(
                $"{instance.GetType().Name} must implement IFindingEngine or IEffectfulFindingEngine."),
        };
    }

    private static string SimpleTypeName(string typeName)
    {
        string trimmed = typeName.Trim();
        int lastDot = trimmed.LastIndexOf('.');

        return lastDot >= 0 ? trimmed[(lastDot + 1)..] : trimmed;
    }

    private static IReadOnlyDictionary<string, Type> LoadKnownImplementationTypes()
    {
        Type[] assemblies =
        [
            typeof(RequirementFindingEngine),
            typeof(CostConstraintFindingEngine),
            typeof(OrphanedAzureResourceFindingEngine),
        ];

        return assemblies
            .Select(static t => t.Assembly)
            .SelectMany(static assembly => assembly.GetExportedTypes())
            .Where(static t => t.IsClass && !t.IsAbstract)
            .Where(static t => BuiltInFindingEngineTypeCatalog.ImplementationTypeNameToEngineType.ContainsKey(t.Name))
            .GroupBy(static t => t.Name, StringComparer.Ordinal)
            .ToDictionary(static g => g.Key, static g => g.First(), StringComparer.Ordinal);
    }

    private static string LocateRepositoryRoot()
    {
        string? directory = Path.GetDirectoryName(typeof(BuiltInFindingEngineTypeCatalogTests).Assembly.Location);

        for (int step = 0;
             step < TestRepositoryPathLimits.MaxStepsFromTestAssemblyBinToSolutionFile && directory is not null;
             step++)
        {
            if (File.Exists(Path.Combine(directory, "ArchLucid.sln")))
                return directory;

            directory = Directory.GetParent(directory)?.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from the test assembly location.");
    }
}
