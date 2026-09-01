using System.Text.Json;

using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public sealed partial class TerraformShowJsonInfrastructureDeclarationParser
{
    private static void CollectFromModule(
        JsonElement module,
        string moduleAddress,
        InfrastructureDeclarationReference declaration,
        List<CanonicalObject> results,
        IReadOnlyDictionary<string, int> labelTotals,
        Dictionary<string, int> labelSeen)
    {
        if (TryGetPropertyIgnoreCase(module, "resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement res in resources.EnumerateArray())
                TryAddResource(res, moduleAddress, declaration, results, labelTotals, labelSeen);
        }

        if (!TryGetPropertyIgnoreCase(module, "child_modules", out JsonElement children) ||
            children.ValueKind != JsonValueKind.Array)
            return;

        foreach (JsonElement child in children.EnumerateArray())
            CollectFromModule(child, ResolveModuleAddress(child), declaration, results, labelTotals, labelSeen);
    }

    private static Dictionary<string, int> CountTerraformLabelOccurrences(JsonElement rootModule)
    {
        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);
        CountModuleLabelOccurrences(rootModule, moduleAddress: string.Empty, counts);

        return counts;
    }

    private static void CountModuleLabelOccurrences(
        JsonElement module,
        string moduleAddress,
        Dictionary<string, int> counts)
    {
        if (TryGetPropertyIgnoreCase(module, "resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement res in resources.EnumerateArray())
            {
                if (TryGetResourceAddress(res, out _))
                    continue;

                if (!TryGetPropertyIgnoreCase(res, "type", out JsonElement typeEl) || typeEl.ValueKind != JsonValueKind.String)
                    continue;

                string tfType = (typeEl.GetString() ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(tfType))
                    continue;

                if (!TryGetPropertyIgnoreCase(res, "name", out JsonElement nameEl) || nameEl.ValueKind != JsonValueKind.String)
                    continue;

                string name = (nameEl.GetString() ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(name))
                    continue;

                string labelKey = BuildTerraformLabelKey(moduleAddress, tfType, name);
                counts[labelKey] = counts.GetValueOrDefault(labelKey) + 1;
            }
        }

        if (!TryGetPropertyIgnoreCase(module, "child_modules", out JsonElement children) ||
            children.ValueKind != JsonValueKind.Array)
            return;

        foreach (JsonElement child in children.EnumerateArray())
            CountModuleLabelOccurrences(child, ResolveModuleAddress(child), counts);
    }

    private static string ResolveModuleAddress(JsonElement module)
    {
        if (!TryGetPropertyIgnoreCase(module, "address", out JsonElement addressElement) ||
            addressElement.ValueKind != JsonValueKind.String)
            return string.Empty;

        string? address = addressElement.GetString();

        return string.IsNullOrWhiteSpace(address) ? string.Empty : address.Trim().ToLowerInvariant();
    }
}
