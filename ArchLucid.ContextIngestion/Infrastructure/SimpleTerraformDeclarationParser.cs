using System.Globalization;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public class SimpleTerraformDeclarationParser : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "simple-terraform", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        return ParseAsync(declaration, terraformBatchByPath: null, fullBatchByPath: null, ct);
    }

    internal Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? terraformBatchByPath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? fullBatchByPath,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(declaration);
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        List<CanonicalObject> results = [];
        HashSet<string> visitedModuleKeys = new(StringComparer.OrdinalIgnoreCase);

        ParseResourcesRecursive(
            declaration,
            declaration.Content,
            terraformBatchByPath,
            fullBatchByPath,
            moduleDepth: 0,
            visitedModuleKeys,
            results);

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static void ParseResourcesRecursive(
        InfrastructureDeclarationReference declaration,
        string content,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? terraformBatchByPath,
        IReadOnlyDictionary<string, InfrastructureDeclarationReference>? fullBatchByPath,
        int moduleDepth,
        HashSet<string> visitedModuleKeys,
        List<CanonicalObject> results)
    {
        ParseResourcesFromContent(declaration, content, results);

        if (terraformBatchByPath is null
            || fullBatchByPath is null
            || moduleDepth >= SimpleTerraformModuleBatchIndex.MaxModuleRecursionDepth)
            return;

        foreach (SimpleTerraformResourceBlockParser.SimpleTerraformModuleBlock moduleBlock in
                 SimpleTerraformResourceBlockParser.ExtractModuleBlocks(content))
        {
            if (SimpleTerraformModuleBatchIndex.IsRemoteModuleSource(moduleBlock.Source))
                continue;

            if (!SimpleTerraformModuleBatchIndex.TryResolveModule(
                    moduleBlock.Source,
                    declaration.Name,
                    terraformBatchByPath,
                    fullBatchByPath,
                    out InfrastructureDeclarationReference moduleDeclaration))
                continue;

            string moduleKey = InfrastructureDeclarationBatchPathIndex.NormalizeLookupKey(moduleDeclaration.Name);

            if (!visitedModuleKeys.Add(moduleKey))
                continue;

            if (string.IsNullOrWhiteSpace(moduleDeclaration.Content))
                continue;

            ParseResourcesRecursive(
                moduleDeclaration,
                moduleDeclaration.Content,
                terraformBatchByPath,
                fullBatchByPath,
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
        IReadOnlyList<SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock> blocks =
            SimpleTerraformResourceBlockParser.ExtractBlocks(content);

        Dictionary<string, int> labelTotals = CountResourceLabelOccurrences(blocks);
        Dictionary<string, int> labelSeen = new(StringComparer.OrdinalIgnoreCase);

        foreach (SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock block in blocks)
        {
            if (SimpleTerraformResourceBlockParser.TryExtractLiteralForEachKeys(block.Body, out IReadOnlyList<string> forEachKeys)
                && forEachKeys.Count > 0)
            {
                foreach (string forEachKey in forEachKeys)
                {
                    AddResourceObject(
                        declaration,
                        block,
                        instanceName: BuildForEachInstanceName(block.Name, forEachKey),
                        forEachKey,
                        labelTotals,
                        labelSeen,
                        results);
                }

                continue;
            }

            AddResourceObject(
                declaration,
                block,
                instanceName: block.Name,
                forEachKey: null,
                labelTotals,
                labelSeen,
                results);
        }
    }

    private static void AddResourceObject(
        InfrastructureDeclarationReference declaration,
        SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock block,
        string instanceName,
        string? forEachKey,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen,
        List<CanonicalObject> results)
    {
        string terraformType = block.TerraformType.Trim();
        string name = instanceName.Trim();

        if (string.IsNullOrWhiteSpace(terraformType) || string.IsNullOrWhiteSpace(name))
            return;

        string objectType = ResolveObjectType(terraformType);
        string canonicalTerraformType = terraformType.ToLowerInvariant();

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = canonicalTerraformType
        };

        if (!string.IsNullOrWhiteSpace(forEachKey))
            properties["forEachKey"] = forEachKey;

        SimpleTerraformResourceBlockParser.ParseBodyIntoProperties(block.Body, properties);
        InfrastructureDeclarationSpecialPropertyMapper.Apply(properties, canonicalTerraformType, name);

        string canonicalName = name.ToLowerInvariant();
        string labelKey = $"{canonicalTerraformType}|{canonicalName}";
        int occurrence = labelSeen.GetValueOrDefault(labelKey) + 1;
        labelSeen[labelKey] = occurrence;

        string stableIdentity = labelTotals[labelKey] > 1
            ? $"{labelKey}|occurrence:{occurrence}"
            : labelKey;

        if (labelTotals[labelKey] > 1)
            properties["terraformOccurrence"] = occurrence.ToString(CultureInfo.InvariantCulture);

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

    private static string BuildForEachInstanceName(string resourceName, string forEachKey)
    {
        return $"{resourceName.Trim()}[\"{forEachKey.Trim().ToLowerInvariant()}\"]";
    }

    private static Dictionary<string, int> CountResourceLabelOccurrences(
        IReadOnlyList<SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock> blocks)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        foreach (SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock block in blocks)
        {
            string terraformType = block.TerraformType.Trim().ToLowerInvariant();
            string baseName = block.Name.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(terraformType) || string.IsNullOrWhiteSpace(baseName))
                continue;

            if (SimpleTerraformResourceBlockParser.TryExtractLiteralForEachKeys(block.Body, out IReadOnlyList<string> forEachKeys)
                && forEachKeys.Count > 0)
            {
                foreach (string forEachKey in forEachKeys)
                {
                    string labelKey = $"{terraformType}|{BuildForEachInstanceName(baseName, forEachKey).ToLowerInvariant()}";
                    counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
                }

                continue;
            }

            string singleLabelKey = $"{terraformType}|{baseName}";
            counts[singleLabelKey] = counts.GetValueOrDefault(singleLabelKey) + 1;
        }

        return counts;
    }

    private static string ResolveObjectType(string terraformType)
    {
        string normalized = terraformType.ToLowerInvariant();

        if (normalized.Contains("key_vault", StringComparison.Ordinal) ||
            normalized.Contains("firewall", StringComparison.Ordinal) ||
            normalized.Contains("network_security_group", StringComparison.Ordinal) ||
            normalized.Contains("aws_security_group", StringComparison.Ordinal) ||
            normalized.Contains("aws_network_acl", StringComparison.Ordinal) ||
            normalized.Contains("google_compute_firewall", StringComparison.Ordinal))

            return "SecurityBaseline";


        return normalized.Contains("policy", StringComparison.Ordinal) ? "PolicyControl" : "TopologyResource";
    }
}
