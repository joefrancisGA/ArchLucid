using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses multi-document Kubernetes YAML manifests into canonical objects.
/// </summary>
public sealed class KubernetesYamlInfrastructureDeclarationParser(
    ILogger<KubernetesYamlInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    private static readonly IDeserializer YamlDeserializer = new DeserializerBuilder()
        .WithNamingConvention(CamelCaseNamingConvention.Instance)
        .IgnoreUnmatchedProperties()
        .Build();

    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "kubernetes-yaml", StringComparison.OrdinalIgnoreCase);
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
            string[] documents = declaration.Content.Split(
                new[] { "\n---", "\r\n---" },
                StringSplitOptions.RemoveEmptyEntries);

            List<JsonElement> jsonDocuments = [];

            foreach (string documentText in documents)
            {
                if (string.IsNullOrWhiteSpace(documentText))
                    continue;

                object? yamlObject = YamlDeserializer.Deserialize<object>(documentText.Trim());

                if (yamlObject is null)
                    continue;

                string json = JsonSerializer.Serialize(yamlObject);
                using JsonDocument jsonDocument = JsonDocument.Parse(json);
                jsonDocuments.Add(jsonDocument.RootElement.Clone());
            }

            IReadOnlyList<CanonicalObject> results = KubernetesManifestCanonicalObjectMapper.MapDocuments(
                jsonDocuments,
                declaration);

            return Task.FromResult(results);
        }
        catch (Exception ex) when (ex is YamlDotNet.Core.YamlException or JsonException)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as kubernetes-yaml; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }
}
