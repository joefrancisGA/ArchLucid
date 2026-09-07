using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses Bicep resource declarations (line-based; not a Bicep compiler).
/// </summary>
public sealed class BicepInfrastructureDeclarationParser : IInfrastructureDeclarationParser
{
    internal const int MaxModuleRecursionDepth = 3;

    private static readonly Regex ResourceRegex = new(
        """
        resource\s+(?<name>[\w-]+)\s+['"](?<type>[^'"]+)['"]
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ModuleRegex = new(
        """
        module\s+(?<name>[\w-]+)\s+['"](?<path>[^'"]+)['"]
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
        return ParseAsync(declaration, batchByPath: null, ct);
    }

    internal Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? batchByPath,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];
        HashSet<string> visitedModuleKeys = new(StringComparer.OrdinalIgnoreCase);

        ParseResourcesRecursive(
            declaration,
            declaration.Content,
            batchByPath,
            moduleDepth: 0,
            visitedModuleKeys,
            results);

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    internal static IEnumerable<string> ExtractModulePaths(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            yield break;

        foreach (Match match in ModuleRegex.Matches(content))
        {
            string modulePath = match.Groups["path"].Value.Trim();

            if (!string.IsNullOrWhiteSpace(modulePath))
                yield return modulePath;
        }
    }

    private static void ParseResourcesRecursive(
        InfrastructureDeclarationReference declaration,
        string content,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? batchByPath,
        int moduleDepth,
        HashSet<string> visitedModuleKeys,
        List<CanonicalObject> results)
    {
        ParseResourcesFromContent(declaration, content, results);

        if (batchByPath is null || moduleDepth >= MaxModuleRecursionDepth)
            return;

        foreach (Match match in ModuleRegex.Matches(content))
        {
            string modulePath = match.Groups["path"].Value.Trim();

            if (string.IsNullOrWhiteSpace(modulePath))
                continue;

            if (!BicepDeclarationBatchIndex.TryResolve(
                    modulePath,
                    declaration.Name,
                    batchByPath,
                    out InfrastructureDeclarationReference moduleDeclaration))
                continue;

            string moduleKey = BicepDeclarationBatchIndex.NormalizeLookupKey(moduleDeclaration.Name);

            if (!visitedModuleKeys.Add(moduleKey))
                continue;

            if (string.IsNullOrWhiteSpace(moduleDeclaration.Content))
                continue;

            ParseResourcesRecursive(
                moduleDeclaration,
                moduleDeclaration.Content,
                batchByPath,
                moduleDepth + 1,
                visitedModuleKeys,
                results);
        }
    }

    private static void ParseResourcesFromContent(
        InfrastructureDeclarationReference declaration,
        string content,
        List<CanonicalObject> results)
    {
        MatchCollection matches = ResourceRegex.Matches(content);
        Dictionary<string, int> labelTotals = CountSymbolicNameOccurrences(matches);
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

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

            string fromMatch = content[match.Index..];
            int braceIndex = fromMatch.IndexOf('{', StringComparison.Ordinal);

            if (braceIndex >= 0)
            {
                string braceBody = InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBraceBody(fromMatch, braceIndex);

                if (!string.IsNullOrWhiteSpace(braceBody))
                    BicepResourceBodyParser.ParseBodyIntoProperties(braceBody, properties);
            }

            string canonicalName = symbolicName.ToLowerInvariant();
            string canonicalResourceType = resourceType.ToLowerInvariant();
            string labelKey = $"{canonicalResourceType}|{canonicalName}";
            int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
            labelSeen[labelKey] = occurrence;

            string stableIdentity = labelTotals[labelKey] > 1
                ? $"{labelKey}|occurrence:{occurrence}"
                : labelKey;

            if (labelTotals[labelKey] > 1)
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
    }

    private static Dictionary<string, int> CountSymbolicNameOccurrences(MatchCollection matches)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in matches)
        {
            string symbolicName = match.Groups["name"].Value.Trim();
            string fullType = match.Groups["type"].Value.Trim();

            if (string.IsNullOrWhiteSpace(symbolicName) || string.IsNullOrWhiteSpace(fullType))
                continue;

            string resourceType = fullType;
            int versionSeparator = fullType.IndexOf('@', StringComparison.Ordinal);

            if (versionSeparator >= 0)
                resourceType = fullType[..versionSeparator].Trim();

            string labelKey = $"{resourceType.ToLowerInvariant()}|{symbolicName.ToLowerInvariant()}";
            counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
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
