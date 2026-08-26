using System.Globalization;
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
        module\s+(?<name>[\w-]+)\s+['"](?<source>[^'"]+)['"]
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
        Dictionary<string, int> identityTotals = CountBicepIdentityOccurrences(declaration.Content);
        Dictionary<string, int> identitySeen = new(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in ResourceRegex.Matches(declaration.Content))
        {
            string symbolicName = match.Groups["name"].Value.Trim();
            string fullType = match.Groups["type"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName) || string.IsNullOrWhiteSpace(fullType))
                continue;

            ParseResourceMatch(
                declaration,
                results,
                identityTotals,
                identitySeen,
                symbolicName,
                fullType,
                isModule: false,
                moduleSource: null);
        }

        foreach (Match match in ModuleRegex.Matches(declaration.Content))
        {
            string symbolicName = match.Groups["name"].Value.Trim();
            string moduleSource = match.Groups["source"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName) || string.IsNullOrWhiteSpace(moduleSource))
                continue;

            ParseResourceMatch(
                declaration,
                results,
                identityTotals,
                identitySeen,
                symbolicName,
                fullType: "bicep.module",
                isModule: true,
                moduleSource);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static void ParseResourceMatch(
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> identityTotals,
        Dictionary<string, int> identitySeen,
        string symbolicName,
        string fullType,
        bool isModule,
        string? moduleSource)
    {
        string resourceType = fullType;
        string apiVersion = string.Empty;
        int versionSeparator = fullType.IndexOf('@', StringComparison.Ordinal);

        if (!isModule && versionSeparator >= 0)
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

        if (isModule)
        {
            properties["bicepModuleSource"] = moduleSource!.ToLowerInvariant();
        }
        else if (!string.IsNullOrWhiteSpace(apiVersion))
        {
            properties["apiVersion"] = apiVersion.ToLowerInvariant();
        }

        string canonicalName = symbolicName.ToLowerInvariant();
        string canonicalResourceType = resourceType.ToLowerInvariant();
        string identityKey = isModule
            ? $"module|{canonicalName}"
            : $"{canonicalResourceType}|{canonicalName}";

        int occurrence = identitySeen.GetValueOrDefault(identityKey) + 1;
        identitySeen[identityKey] = occurrence;

        string stableIdentity = identityTotals[identityKey] > 1
            ? $"{identityKey}|occurrence:{occurrence}"
            : identityKey;

        if (identityTotals[identityKey] > 1)
            properties["bicepOccurrence"] = occurrence.ToString(CultureInfo.InvariantCulture);

        results.Add(new CanonicalObject
        {
            ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                declaration.DeclarationId,
                objectType,
                stableIdentity),
            ObjectType = objectType,
            Name = canonicalName,
            SourceType = "InfrastructureDeclaration",
            SourceId = declaration.DeclarationId,
            Properties = properties
        });
    }

    private static Dictionary<string, int> CountBicepIdentityOccurrences(string content)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in ResourceRegex.Matches(content))
        {
            string symbolicName = match.Groups["name"].Value.Trim();
            string fullType = match.Groups["type"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName) || string.IsNullOrWhiteSpace(fullType))
                continue;

            string resourceType = fullType;
            int versionSeparator = fullType.IndexOf('@', StringComparison.Ordinal);

            if (versionSeparator >= 0)
                resourceType = fullType[..versionSeparator].Trim();

            string identityKey = $"{resourceType.ToLowerInvariant()}|{symbolicName.ToLowerInvariant()}";
            counts[identityKey] = counts.GetValueOrDefault(identityKey) + 1;
        }

        foreach (Match match in ModuleRegex.Matches(content))
        {
            string symbolicName = match.Groups["name"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName))
                continue;

            string identityKey = $"module|{symbolicName.ToLowerInvariant()}";
            counts[identityKey] = counts.GetValueOrDefault(identityKey) + 1;
        }

        return counts;
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
