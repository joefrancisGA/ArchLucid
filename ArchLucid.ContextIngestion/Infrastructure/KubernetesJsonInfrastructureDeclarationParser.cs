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
            IReadOnlyList<JsonElement> documents = ParseJsonDocuments(declaration.Content);
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

    private static IReadOnlyList<JsonElement> ParseJsonDocuments(string content)
    {
        string trimmedContent = content.Trim();

        if (string.IsNullOrWhiteSpace(trimmedContent))
            return [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmedContent);

            return [document.RootElement.Clone()];
        }
        catch (JsonException)
        {
            List<JsonElement> documents = [];

            foreach (string line in trimmedContent.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                string trimmedLine = line.Trim();

                if (string.IsNullOrWhiteSpace(trimmedLine))
                    continue;

                using JsonDocument document = JsonDocument.Parse(trimmedLine);
                documents.Add(document.RootElement.Clone());
            }

            return documents;
        }
    }
}
