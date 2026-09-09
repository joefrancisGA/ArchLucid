using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses multi-document Kubernetes YAML manifests into canonical objects.
/// </summary>
public sealed class KubernetesYamlInfrastructureDeclarationParser(
    ILogger<KubernetesYamlInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
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
            IReadOnlyList<CanonicalObject> results = KubernetesYamlContentParser.ParseContent(
                declaration.Content,
                declaration,
                logger);

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
