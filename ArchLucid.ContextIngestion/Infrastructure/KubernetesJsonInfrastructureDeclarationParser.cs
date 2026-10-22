using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Kubernetes API JSON (<c>kubectl get -o json</c>) into canonical objects.
/// </summary>
public sealed class KubernetesJsonInfrastructureDeclarationParser(
    ILogger<KubernetesJsonInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "kubernetes-json", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        try
        {
            using JsonDocument document = JsonDocument.Parse(declaration.Content);
            JsonElement root = document.RootElement;
            IReadOnlyList<JsonElement> documents = root.ValueKind is JsonValueKind.Array
                ? root.EnumerateArray()
                    .Where(element => element.ValueKind is JsonValueKind.Object)
                    .ToList()
                : [root];

            IReadOnlyList<CanonicalObject> results = KubernetesManifestCanonicalObjectMapper.MapDocuments(
                documents,
                declaration);

            return Task.FromResult(results);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as kubernetes-json; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }
}
