using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses CDK synth <c>cdk.out/*.template.json</c> artifacts via the CloudFormation parser (DX-42).
/// </summary>
public sealed class CdkSynthInfrastructureDeclarationParser(
    ILogger<CdkSynthInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "cdk-synth", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        if (!ShouldParseDeclaration(declaration))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        try
        {
            IReadOnlyList<CanonicalObject> results = CloudFormationTemplateParser.ParseTemplateContent(
                declaration,
                declaration.Content,
                logger);

            return Task.FromResult(results);
        }
        catch (System.Text.Json.JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Failed to parse infrastructure declaration '{Name}' (DeclarationId={DeclarationId}) as cdk-synth; skipping.",
                declaration.Name,
                declaration.DeclarationId);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }
    }

    private static bool ShouldParseDeclaration(InfrastructureDeclarationReference declaration)
    {
        if (declaration.Name.EndsWith(".template.json", StringComparison.OrdinalIgnoreCase))
            return true;

        return CloudFormationInfrastructureDeclarationParser.LooksLikeCloudFormationTemplate(declaration.Content);
    }
}
