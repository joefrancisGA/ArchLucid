using System.Text;
using System.Text.Json;

using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Risk;

internal static class ManifestTradeoffScanContextBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    public static ManifestTradeoffScanContext Build(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        StringBuilder textBuilder = new();
        AppendSection(textBuilder, manifest.Topology);
        AppendSection(textBuilder, manifest.Security);
        AppendSection(textBuilder, manifest.Cost);
        AppendSection(textBuilder, manifest.Constraints);
        AppendSection(textBuilder, manifest.Requirements);
        AppendSection(textBuilder, manifest.Compliance);

        foreach (string resource in manifest.Topology.Resources)
            textBuilder.AppendLine(resource);

        foreach (string pattern in manifest.Topology.SelectedPatterns)
            textBuilder.AppendLine(pattern);

        Dictionary<string, int> fanIn = BuildDependencyFanIn(manifest);

        return new ManifestTradeoffScanContext(textBuilder.ToString().ToLowerInvariant(), fanIn);
    }

    private static void AppendSection(StringBuilder textBuilder, object? section)
    {
        if (section is null)
            return;

        string json = JsonSerializer.Serialize(section, JsonOptions);
        textBuilder.AppendLine(json);
    }

    private static Dictionary<string, int> BuildDependencyFanIn(ManifestDocument manifest)
    {
        Dictionary<string, int> fanIn = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchLucid.Contracts.Manifest.ManifestRelationship relationship in manifest.Topology.Relationships)
        {
            if (string.IsNullOrWhiteSpace(relationship.TargetId))
                continue;

            fanIn.TryGetValue(relationship.TargetId, out int current);
            fanIn[relationship.TargetId] = current + 1;
        }

        return fanIn;
    }
}
