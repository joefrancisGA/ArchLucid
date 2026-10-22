using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses CloudFormation JSON/YAML templates into canonical objects (DX-42).
/// </summary>
public sealed class CloudFormationInfrastructureDeclarationParser(
    ILogger<CloudFormationInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "cloudformation", StringComparison.OrdinalIgnoreCase);
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
            IReadOnlyList<CanonicalObject> results = CloudFormationTemplateParser.ParseTemplateContent(
                declaration,
                declaration.Content,
                logger);

            return Task.FromResult(results);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as cloudformation; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }

    internal static bool LooksLikeCloudFormationTemplate(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return false;

        string trimmed = content.TrimStart();

        if (trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            return CloudFormationTemplateParser.HasResourcesMap(document.RootElement);
        }

        if (trimmed.StartsWith("AWSTemplateFormatVersion", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("Resources:", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }
}
