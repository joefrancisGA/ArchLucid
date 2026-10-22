using System.Reflection;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
/// Documented azurerm resource types at provider v5.6.0
/// (commit daf16e27e2d45d2fb6b7d83644dc201363b05e62).
/// Lookup is exact slug membership. Runtime does not call the network.
/// </summary>
internal static class TerraformAzurermResourceTypeCatalog
{
    internal const string ResourceName =
        "ArchLucid.Application.Runs.Orchestration.azurerm-resource-types-v5.6.0.txt";

    internal const int ExpectedCount = 1105;

    private static readonly Lazy<(IReadOnlyList<string> Slugs, HashSet<string> Members)> Loaded = new(Load);

    internal static int Count => Loaded.Value.Slugs.Count;

    internal static IReadOnlyList<string> Slugs => Loaded.Value.Slugs;

    internal static bool ContainsSlug(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        return Loaded.Value.Members.Contains(slug);
    }

    internal static bool ContainsSourceId(string? sourceId)
    {
        string? slug = TerraformAzurermResourceTypeParser.TryParseSlug(sourceId);

        if (slug is null)
            return false;

        return ContainsSlug(slug);
    }

    private static (IReadOnlyList<string> Slugs, HashSet<string> Members) Load()
    {
        Assembly assembly = typeof(TerraformAzurermResourceTypeCatalog).Assembly;
        using Stream? stream = assembly.GetManifestResourceStream(ResourceName);

        if (stream is null)
            throw new InvalidOperationException($"Embedded azurerm resource catalog was not found: {ResourceName}");

        using StreamReader reader = new(stream);
        List<string> slugs = new(ExpectedCount);
        HashSet<string> members = new(ExpectedCount, StringComparer.OrdinalIgnoreCase);

        string? line = reader.ReadLine();

        while (line is not null)
        {
            // Comment lines are the pin header, not resource slugs.
            if (line.Length == 0 || line[0] == '#')
            {
                line = reader.ReadLine();
                continue;
            }

            string slug = line.Trim();

            if (!members.Add(slug))
                throw new InvalidOperationException($"Duplicate azurerm resource slug: {slug}");

            slugs.Add(slug);
            line = reader.ReadLine();
        }

        if (slugs.Count != ExpectedCount)
            throw new InvalidOperationException($"Expected {ExpectedCount} azurerm resource slugs, found {slugs.Count}.");

        return (slugs, members);
    }
}
