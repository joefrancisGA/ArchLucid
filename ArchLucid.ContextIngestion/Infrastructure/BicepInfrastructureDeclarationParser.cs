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

    private static readonly Regex ModuleRegex = new(
        """
        module\s+(?<name>[\w-]+)\s+['"](?<type>[^'"]+)['"]
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
        List<BicepDeclarationMatch> declarations = CollectDeclarations(declaration.Content);

        foreach (BicepDeclarationMatch declarationMatch in declarations)
        {
            string symbolicName = declarationMatch.SymbolicName;
            string fullType = declarationMatch.FullType;

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

            if (declarationMatch.IsModule)
                properties["bicepModule"] = "true";

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

    private static List<BicepDeclarationMatch> CollectDeclarations(string content)
    {
        List<(int Index, BicepDeclarationMatch Match)> declarations = [];

        foreach (Match match in ResourceRegex.Matches(content))
        {
            declarations.Add((match.Index, new BicepDeclarationMatch(
                match.Groups["name"].Value.Trim(),
                match.Groups["type"].Value.Trim(),
                IsModule: false)));
        }

        foreach (Match match in ModuleRegex.Matches(content))
        {
            declarations.Add((match.Index, new BicepDeclarationMatch(
                match.Groups["name"].Value.Trim(),
                match.Groups["type"].Value.Trim(),
                IsModule: true)));
        }

        return declarations
            .OrderBy(static declaration => declaration.Index)
            .Select(static declaration => declaration.Match)
            .ToList();
    }

    private readonly record struct BicepDeclarationMatch(string SymbolicName, string FullType, bool IsModule);

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
