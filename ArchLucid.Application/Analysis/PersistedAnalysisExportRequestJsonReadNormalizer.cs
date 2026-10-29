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

        return root.ToJsonString();
    }

    private static void CoerceWhitespaceOnlyDeterminismIterationsString(JsonObject root)
    {
        if (!root.TryGetPropertyValue("determinismIterations", out JsonNode? determinismIterationsNode))
            return;

        if (determinismIterationsNode is not JsonValue value)
            return;

        if (!value.TryGetValue<string>(out string? text))
            return;

        if (string.IsNullOrWhiteSpace(text))
            root.Remove("determinismIterations");
    }
}
