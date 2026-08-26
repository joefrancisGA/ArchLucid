using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Bicep resource declarations (line-based; not a Bicep compiler).
/// </summary>
public sealed class BicepInfrastructureDeclarationParser : IInfrastructureDeclarationParser
{
    private static readonly Regex ResourceRegex = new(
        """
        resource\s+(?<name>[\w-]+)\s+['"](?<type>[^'"]+)['"]
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "bicep", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];
        MatchCollection matches = ResourceRegex.Matches(declaration.Content);

        foreach (Match match in matches)
        {
            string symbolicName = match.Groups["name"].Value.Trim();
            string fullType = match.Groups["type"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName) || string.IsNullOrWhiteSpace(fullType))
                continue;

            string resourceType = fullType;
            string apiVersion = string.Empty;
            int versionSeparator = fullType.IndexOf('@', StringComparison.Ordinal);

            if (versionSeparator >= 0)
            {
                resourceType = fullType[..versionSeparator].Trim();
                apiVersion = fullType[(versionSeparator + 1)..].Trim();
            }

            string objectType = ResolveObjectType(resourceType);

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = resourceType.ToLowerInvariant(),
                ["bicepSymbolicName"] = symbolicName.ToLowerInvariant(),
            };

            if (!string.IsNullOrWhiteSpace(apiVersion))
                properties["apiVersion"] = apiVersion.ToLowerInvariant();

            string canonicalName = symbolicName.ToLowerInvariant();
            string canonicalResourceType = resourceType.ToLowerInvariant();

            results.Add(new CanonicalObject
            {
                ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                    declaration.DeclarationId,
                    objectType,
                    $"{canonicalResourceType}|{canonicalName}"),
                ObjectType = objectType,
                Name = canonicalName,
                SourceType = "InfrastructureDeclaration",
                SourceId = declaration.DeclarationId,
                Properties = properties
            });
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static string ResolveObjectType(string resourceType)
    {
        string normalized = resourceType.ToLowerInvariant();

        if (normalized.Contains("keyvault", StringComparison.Ordinal)
            || normalized.Contains("firewall", StringComparison.Ordinal)
            || normalized.Contains("networksecuritygroups", StringComparison.Ordinal)
            || normalized.Contains("webapplicationfirewall", StringComparison.Ordinal))
            return "SecurityBaseline";

        if (normalized.Contains("policydefinitions", StringComparison.Ordinal)
            || normalized.Contains("policyassignments", StringComparison.Ordinal))
            return "PolicyControl";

        return "TopologyResource";
    }
}
