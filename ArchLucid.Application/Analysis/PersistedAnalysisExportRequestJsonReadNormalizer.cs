using System.Text.Json.Nodes;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Coerces legacy persisted analysis request JSON into shapes <see cref="AnalysisExportRequestRehydrator" /> can deserialize.
/// </summary>
internal static class PersistedAnalysisExportRequestJsonReadNormalizer
{
    internal static string NormalizeForRehydrate(string analysisRequestJson)
    {
        ArgumentException.ThrowIfNullOrEmpty(analysisRequestJson);

        JsonNode? rootNode = JsonNode.Parse(analysisRequestJson);
        if (rootNode is not JsonObject root)
            return analysisRequestJson;

        CoerceWhitespaceOnlyDeterminismIterationsString(root);
        CoerceWhitespaceOnlyBooleanStrings(root);

        return root.ToJsonString();
    }

    private static readonly HashSet<string> BooleanPropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(PersistedAnalysisExportRequest.ExternalDelivery),
        nameof(PersistedAnalysisExportRequest.ExecutiveFriendly),
        nameof(PersistedAnalysisExportRequest.RegulatedEnvironment),
        nameof(PersistedAnalysisExportRequest.NeedDetailedEvidence),
        nameof(PersistedAnalysisExportRequest.NeedExecutionTraces),
        nameof(PersistedAnalysisExportRequest.NeedDeterminismOrCompareAppendices),
        nameof(PersistedAnalysisExportRequest.IncludeEvidence),
        nameof(PersistedAnalysisExportRequest.IncludeExecutionTraces),
        nameof(PersistedAnalysisExportRequest.IncludeManifest),
        nameof(PersistedAnalysisExportRequest.IncludeDiagram),
        nameof(PersistedAnalysisExportRequest.IncludeSummary),
        nameof(PersistedAnalysisExportRequest.IncludeDeterminismCheck),
        nameof(PersistedAnalysisExportRequest.IncludeManifestCompare),
        nameof(PersistedAnalysisExportRequest.IncludeAgentResultCompare),
    };

    private static void CoerceWhitespaceOnlyBooleanStrings(JsonObject root)
    {
        List<string> remove = [];

        foreach (KeyValuePair<string, JsonNode?> property in root)
        {
            if (!BooleanPropertyNames.Contains(property.Key))
                continue;

            if (property.Value is not JsonValue value)
                continue;

            if (!value.TryGetValue<string>(out string? text))
                continue;

            if (string.IsNullOrWhiteSpace(text))
                remove.Add(property.Key);
        }

        foreach (string key in remove)
            root.Remove(key);
    }

    private static void CoerceWhitespaceOnlyDeterminismIterationsString(JsonObject root)
    {
        foreach (KeyValuePair<string, JsonNode?> property in root)
        {
            if (!string.Equals(property.Key, "determinismIterations", StringComparison.OrdinalIgnoreCase))
                continue;

            if (property.Value is not JsonValue value)
                return;

            if (!value.TryGetValue<string>(out string? text))
                return;

            if (string.IsNullOrWhiteSpace(text))
                root.Remove(property.Key);

            return;
        }
    }
}
