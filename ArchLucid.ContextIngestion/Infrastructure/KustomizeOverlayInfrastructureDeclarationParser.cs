using System.Text.Json;

using ArchLucid.ContextIngestion.Infrastructure.Canonical;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Parsing;

using Microsoft.Extensions.Logging;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Resolves in-batch Kustomize overlays and maps referenced manifests to canonical objects (DX-30).
/// </summary>
public sealed class KustomizeOverlayInfrastructureDeclarationParser(
    ILogger<KustomizeOverlayInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    internal const int MaxRecursionDepth = 3;

    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "kustomize", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        return ParseAsync(declaration, batchByPath: null, ct);
    }

    internal Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? batchByPath,
        CancellationToken ct)
    {
        _ = ct;

        if (batchByPath is null || batchByPath.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (!IsKustomizationManifest(declaration.Name))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (string.IsNullOrWhiteSpace(declaration.Content))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        List<CanonicalObject> results = [];
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase);

        CollectObjectsRecursive(
            declaration,
            batchByPath,
            depth: 0,
            visited,
            results);

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    internal static bool IsKustomizationManifest(string declarationName)
    {
        if (string.IsNullOrWhiteSpace(declarationName))
        {
            return false;
        }

        string fileName = Path.GetFileName(declarationName.Replace('/', Path.DirectorySeparatorChar));

        return string.Equals(fileName, "kustomization.yaml", StringComparison.OrdinalIgnoreCase)
            || string.Equals(fileName, "kustomization.yml", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool IsRemoteReference(string reference)
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            return true;
        }

        string trimmed = reference.Trim();

        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return trimmed.Contains("github.com/", StringComparison.OrdinalIgnoreCase);
    }

    internal static HashSet<string> CollectConsumedResourcePaths(
        IEnumerable<InfrastructureDeclarationReference> declarations,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath)
    {
        HashSet<string> consumed = new(StringComparer.OrdinalIgnoreCase);

        foreach (InfrastructureDeclarationReference declaration in declarations)
        {
            if (!IsKustomizationManifest(declaration.Name))
            {
                continue;
            }

            HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase);
            CollectConsumedPathsRecursive(declaration, batchByPath, depth: 0, visited, consumed);
        }

        return consumed;
    }

    private void CollectObjectsRecursive(
        InfrastructureDeclarationReference kustomizationDeclaration,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        int depth,
        HashSet<string> visited,
        List<CanonicalObject> results)
    {
        if (depth >= MaxRecursionDepth)
        {
            return;
        }

        string visitKey = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(kustomizationDeclaration.Name);

        if (!visited.Add(visitKey))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(kustomizationDeclaration.Content))
        {
            return;
        }

        if (!TryParseKustomizationDocument(kustomizationDeclaration.Content, out JsonElement root))
        {
            return;
        }

        foreach (string resourceReference in ReadStringArray(root, "resources"))
        {
            if (IsRemoteReference(resourceReference))
            {
                continue;
            }

            ResolveAndCollectManifest(kustomizationDeclaration, resourceReference, batchByPath, depth, visited, results);
        }

        foreach (string patchReference in ReadStringArray(root, "patchesStrategicMerge"))
        {
            if (IsRemoteReference(patchReference))
            {
                continue;
            }

            ResolveAndCollectManifest(kustomizationDeclaration, patchReference, batchByPath, depth, visited, results);
        }

        foreach (string baseReference in ReadStringArray(root, "bases"))
        {
            if (IsRemoteReference(baseReference))
            {
                continue;
            }

            if (!InfrastructureDeclarationBatchPathIndex.TryResolve(
                    baseReference,
                    kustomizationDeclaration.Name,
                    batchByPath,
                    out InfrastructureDeclarationReference baseDeclaration))
            {
                continue;
            }

            if (IsKustomizationManifest(baseDeclaration.Name))
            {
                CollectObjectsRecursive(baseDeclaration, batchByPath, depth + 1, visited, results);
            }
            else
            {
                AddManifestObjects(baseDeclaration, results);
            }
        }
    }

    private static void CollectConsumedPathsRecursive(
        InfrastructureDeclarationReference kustomizationDeclaration,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        int depth,
        HashSet<string> visited,
        HashSet<string> consumed)
    {
        if (depth >= MaxRecursionDepth)
        {
            return;
        }

        string visitKey = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(kustomizationDeclaration.Name);

        if (!visited.Add(visitKey))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(kustomizationDeclaration.Content))
        {
            return;
        }

        if (!TryParseKustomizationDocument(kustomizationDeclaration.Content, out JsonElement root))
        {
            return;
        }

        foreach (string resourceReference in ReadStringArray(root, "resources"))
        {
            if (IsRemoteReference(resourceReference))
            {
                continue;
            }

            TrackResolvedPath(kustomizationDeclaration, resourceReference, batchByPath, depth, visited, consumed);
        }

        foreach (string patchReference in ReadStringArray(root, "patchesStrategicMerge"))
        {
            if (IsRemoteReference(patchReference))
            {
                continue;
            }

            TrackResolvedPath(kustomizationDeclaration, patchReference, batchByPath, depth, visited, consumed);
        }

        foreach (string baseReference in ReadStringArray(root, "bases"))
        {
            if (IsRemoteReference(baseReference))
            {
                continue;
            }

            if (!InfrastructureDeclarationBatchPathIndex.TryResolve(
                    baseReference,
                    kustomizationDeclaration.Name,
                    batchByPath,
                    out InfrastructureDeclarationReference baseDeclaration))
            {
                continue;
            }

            consumed.Add(InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(baseDeclaration.Name));

            if (IsKustomizationManifest(baseDeclaration.Name))
            {
                CollectConsumedPathsRecursive(baseDeclaration, batchByPath, depth + 1, visited, consumed);
            }
        }
    }

    private void ResolveAndCollectManifest(
        InfrastructureDeclarationReference parentDeclaration,
        string relativePath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        int depth,
        HashSet<string> visited,
        List<CanonicalObject> results)
    {
        if (!InfrastructureDeclarationBatchPathIndex.TryResolve(
                relativePath,
                parentDeclaration.Name,
                batchByPath,
                out InfrastructureDeclarationReference resolvedDeclaration))
        {
            return;
        }

        if (IsKustomizationManifest(resolvedDeclaration.Name))
        {
            CollectObjectsRecursive(resolvedDeclaration, batchByPath, depth + 1, visited, results);

            return;
        }

        AddManifestObjects(resolvedDeclaration, results);
    }

    private void AddManifestObjects(
        InfrastructureDeclarationReference manifestDeclaration,
        List<CanonicalObject> results)
    {
        if (string.IsNullOrWhiteSpace(manifestDeclaration.Content))
        {
            return;
        }

        results.AddRange(
            KubernetesYamlContentParser.ParseContent(manifestDeclaration.Content, manifestDeclaration, logger));
    }

    private static void TrackResolvedPath(
        InfrastructureDeclarationReference parentDeclaration,
        string relativePath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference> batchByPath,
        int depth,
        HashSet<string> visited,
        HashSet<string> consumed)
    {
        if (!InfrastructureDeclarationBatchPathIndex.TryResolve(
                relativePath,
                parentDeclaration.Name,
                batchByPath,
                out InfrastructureDeclarationReference resolvedDeclaration))
        {
            return;
        }

        consumed.Add(InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(resolvedDeclaration.Name));

        if (IsKustomizationManifest(resolvedDeclaration.Name))
        {
            CollectConsumedPathsRecursive(resolvedDeclaration, batchByPath, depth + 1, visited, consumed);
        }
    }

    private static bool TryParseKustomizationDocument(string content, out JsonElement root)
    {
        root = default;

        try
        {
            object? yamlObject = YamlDeserializer.Deserialize<object>(content.Trim());

            if (yamlObject is null)
            {
                return false;
            }

            string json = JsonSerializer.Serialize(yamlObject);
            using JsonDocument jsonDocument = JsonDocument.Parse(json);
            root = jsonDocument.RootElement.Clone();

            return root.ValueKind is JsonValueKind.Object;
        }
        catch (Exception ex) when (ex is YamlDotNet.Core.YamlException or JsonException)
        {
            return false;
        }
    }

    private static IEnumerable<string> ReadStringArray(JsonElement root, string propertyName)
    {
        if (!CanonicalInfrastructureJsonElementReader.TryGetPropertyIgnoreCase(root, propertyName, out JsonElement arrayElement))
        {
            yield break;
        }

        if (arrayElement.ValueKind is not JsonValueKind.Array)
        {
            yield break;
        }

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            string? value = item.GetString();

            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            yield return value.Trim();
        }
    }
}
