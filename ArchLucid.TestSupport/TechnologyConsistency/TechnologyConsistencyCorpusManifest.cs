using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.TestSupport.GoldenCorpus;

namespace ArchLucid.TestSupport.TechnologyConsistency;

/// <summary>Loads <c>tests/technology-consistency-corpus/manifest.json</c> from test output.</summary>
public static class TechnologyConsistencyCorpusManifest
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    public static IReadOnlyList<TechnologyConsistencyCorpusScenario> LoadScenarios()
    {
        string manifestPath = TechnologyConsistencyCorpusPaths.ManifestPath;

        if (!File.Exists(manifestPath))
            throw new FileNotFoundException("Technology consistency corpus manifest was not copied to test output.", manifestPath);

        string json = File.ReadAllText(manifestPath);
        TechnologyConsistencyCorpusManifestDocument? document =
            JsonSerializer.Deserialize<TechnologyConsistencyCorpusManifestDocument>(json, JsonOptions);

        if (document?.Scenarios is null || document.Scenarios.Count == 0)
            throw new InvalidOperationException("Technology consistency corpus manifest contains no scenarios.");

        return document.Scenarios;
    }

    public static IReadOnlyList<TechnologyConsistencyCorpusScenario> LoadFindingEngineScenarios()
    {
        return LoadScenarios()
            .Where(scenario => string.Equals(scenario.Kind, "finding-engine", StringComparison.Ordinal))
            .Where(scenario => !scenario.Path.EndsWith("revision-coherent-to-drift", StringComparison.Ordinal))
            .ToList();
    }

    public static IReadOnlyList<TechnologyConsistencyCorpusScenario> LoadArtifactLintScenarios()
    {
        return LoadScenarios()
            .Where(scenario => string.Equals(scenario.Kind, "artifact-lint", StringComparison.Ordinal))
            .ToList();
    }

    internal static JsonSerializerOptions CreateJsonOptions()
    {
        JsonSerializerOptions options = new(GoldenCorpusJson.SerializerOptions);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}

public sealed class TechnologyConsistencyCorpusManifestDocument
{
    public List<TechnologyConsistencyCorpusScenario> Scenarios
    {
        get;
        set;
    } = [];
}

public sealed class TechnologyConsistencyCorpusScenario
{
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    public string Path
    {
        get;
        set;
    } = string.Empty;
}
