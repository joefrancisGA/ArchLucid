using System.Text.Json;
using System.Text.RegularExpressions;

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
    private static readonly Regex YamlDocumentSeparatorRegex = new(
        """
        ^\s*---\s*$
        """,
        RegexOptions.Multiline | RegexOptions.Compiled);

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
            List<JsonElement> jsonDocuments = [];

            foreach (string documentText in SplitYamlDocuments(declaration.Content))
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

    private static IEnumerable<string> SplitYamlDocuments(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            yield break;

        string normalized = content.TrimStart('\uFEFF').Trim();
        string[] segments = YamlDocumentSeparatorRegex.Split(normalized);

        foreach (string segment in segments)
        {
            string trimmed = segment.Trim();

            if (!string.IsNullOrWhiteSpace(trimmed))
                yield return trimmed;
        }
    }
}
