using System.Text.Json;

namespace ArchLucid.Application.Analysis;

internal static partial class ComparisonReplayPayloadComplexity
{
    private static readonly string[] ManifestDiffListProperties =
    [
        "addedServices",
        "removedServices",
        "addedDatastores",
        "removedDatastores",
        "addedRequiredControls",
        "removedRequiredControls",
        "addedRelationships",
        "removedRelationships"
    ];

    private static int ScoreManifestDiff(JsonElement manifestDiff, ICollection<string> factors)
    {
        int bump = 0;
        int structural = SumListLengths(manifestDiff, ManifestDiffListProperties);

        if (structural > 60)
        {
            bump += 6;
            factors.Add(
                $"Large manifest structural diff (~{structural} added/removed items and relationships) increases replay and formatting work.");
        }
        else if (structural > 30)
        {
            bump += 4;
            factors.Add("Substantial manifest structural diff increases replay and formatting work.");
        }
        else if (structural > 12)
        {
            bump += 2;
            factors.Add("Moderate manifest structural diff adds validation and narrative cost.");
        }
        else if (structural > 0)
        {
            bump += 1;
            factors.Add("Manifest includes structural changes (services, datastores, controls, or relationships).");
        }
        else if (manifestDiff.TryGetProperty("warnings", out JsonElement warnings) &&
                 warnings.ValueKind == JsonValueKind.Array &&
                 warnings.GetArrayLength() > 0)
        {
            bump += 1;
            factors.Add("Manifest includes warning-only drift — replay still validates narrative and formatting scope.");
        }

        return bump;
    }
}
