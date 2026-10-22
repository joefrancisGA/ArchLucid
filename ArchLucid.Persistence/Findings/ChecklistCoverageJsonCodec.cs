using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>Serializes checklist coverage rows stored on <c>dbo.FindingsSnapshots.ChecklistCoverageJson</c>.</summary>
internal static class ChecklistCoverageJsonCodec
{
    internal static string? Serialize(IReadOnlyList<Finding> checklistCoverage)
    {
        if (checklistCoverage.Count == 0)
        {
            return null;
        }

        return JsonEntitySerializer.Serialize(checklistCoverage);
    }

    internal static List<Finding> Deserialize(string? checklistCoverageJson)
    {
        if (string.IsNullOrWhiteSpace(checklistCoverageJson))
        {
            return [];
        }

        try
        {
            List<Finding>? parsed = JsonEntitySerializer.Deserialize<List<Finding>>(checklistCoverageJson);

            return parsed ?? [];
        }
        // JsonEntitySerializer wraps JsonException as InvalidOperationException for corrupt payloads.
        catch (Exception ex) when (ex is JsonException or InvalidOperationException)
        {
            return [];
        }
    }
}
