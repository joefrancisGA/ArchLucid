using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Kubernetes YAML document text into canonical objects (shared by YAML, Helm, and Kustomize parsers).
/// </summary>
internal static class KubernetesYamlContentParser
{
    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    internal static IReadOnlyList<CanonicalObject> ParseContent(
        string yamlContent,
        InfrastructureDeclarationReference declaration,
        ILogger? logger = null)
    {
        ArgumentNullException.ThrowIfNull(declaration);

        if (string.IsNullOrWhiteSpace(yamlContent))
        {
            return [];
        }

        try
        {
            string[] documents = yamlContent.Split(
                new[] { "\n---", "\r\n---" },
                StringSplitOptions.RemoveEmptyEntries);

            List<JsonElement> jsonDocuments = [];

            foreach (string documentText in documents)
            {
                if (string.IsNullOrWhiteSpace(documentText))
                {
                    continue;
                }

                string trimmedDocument = documentText.Trim();

                if (trimmedDocument.Contains("{{", StringComparison.Ordinal))
                {
                    continue;
                }

                object? yamlObject = YamlDeserializer.Deserialize<object>(trimmedDocument);

                if (yamlObject is null)
                {
                    continue;
                }

                string json = JsonSerializer.Serialize(yamlObject);
                using JsonDocument jsonDocument = JsonDocument.Parse(json);
                jsonDocuments.Add(jsonDocument.RootElement.Clone());
            }

            return KubernetesManifestCanonicalObjectMapper.MapDocuments(jsonDocuments, declaration);
        }
        catch (Exception ex) when (ex is YamlDotNet.Core.YamlException or JsonException)
        {
            logger?.LogWarning(
                ex,
                "Failed to parse Kubernetes YAML for '{Name}' (DeclarationId={DeclarationId}); skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return [];
        }
    }
}
