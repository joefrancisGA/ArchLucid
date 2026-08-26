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
            List<JsonElement> jsonDocuments = [];

            if (TryParseSingleJsonDocument(declaration.Content, out JsonElement singleRoot))
            {
                jsonDocuments.Add(singleRoot);
            }
            else
            {
                foreach (string line in declaration.Content.Split(
                             '\n',
                             StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    using JsonDocument document = JsonDocument.Parse(line);
                    jsonDocuments.Add(document.RootElement.Clone());
                }
            }

            IReadOnlyList<CanonicalObject> results = KubernetesManifestCanonicalObjectMapper.MapDocuments(
                jsonDocuments,
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

    private static bool TryParseSingleJsonDocument(string content, out JsonElement root)
    {
        root = default;

        if (string.IsNullOrWhiteSpace(content))
            return false;

        try
        {
            using JsonDocument document = JsonDocument.Parse(content);
            root = document.RootElement.Clone();

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
