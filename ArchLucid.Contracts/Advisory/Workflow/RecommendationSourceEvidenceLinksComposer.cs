using System.Text.Json;

namespace ArchLucid.Contracts.Advisory.Workflow;

/// <summary>
///     Builds persisted <c>SourceEvidenceLinksJson</c> from recommendation supporting-id arrays.
/// </summary>
public static class RecommendationSourceEvidenceLinksComposer
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public const string KindFinding = "finding";

    public const string KindManifestSection = "manifestSection";

    public static string ComposeJson(
        IEnumerable<string> supportingFindingIds,
        IEnumerable<string> supportingDecisionIds,
        IEnumerable<string> supportingArtifactIds)
    {
        List<RecommendationSourceEvidenceLink> links = [];

        foreach (string findingId in NormalizeIds(supportingFindingIds))
        {
            links.Add(new RecommendationSourceEvidenceLink { Kind = KindFinding, Id = findingId });
        }

        foreach (string decisionId in NormalizeIds(supportingDecisionIds))
        {
            links.Add(new RecommendationSourceEvidenceLink { Kind = KindManifestSection, Id = decisionId });
        }

        foreach (string artifactId in NormalizeIds(supportingArtifactIds))
        {
            links.Add(new RecommendationSourceEvidenceLink { Kind = KindManifestSection, Id = artifactId });
        }

        return JsonSerializer.Serialize(links, JsonOptions);
    }

    public static IReadOnlyList<RecommendationSourceEvidenceLink> ParseJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            List<RecommendationSourceEvidenceLink>? links =
                JsonSerializer.Deserialize<List<RecommendationSourceEvidenceLink>>(json, JsonOptions);

            return links ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static IReadOnlyList<RecommendationSourceEvidenceLink> FromRecord(RecommendationRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        IReadOnlyList<RecommendationSourceEvidenceLink> parsed = ParseJson(record.SourceEvidenceLinksJson);

        if (parsed.Count > 0)
            return parsed;

        return ParseJson(
            ComposeJson(
                DeserializeStringIds(record.SupportingFindingIdsJson),
                DeserializeStringIds(record.SupportingDecisionIdsJson),
                DeserializeStringIds(record.SupportingArtifactIdsJson)));
    }

    private static IEnumerable<string> NormalizeIds(IEnumerable<string> ids)
    {
        return ids
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> DeserializeStringIds(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            List<string>? ids = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);

            return ids ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
