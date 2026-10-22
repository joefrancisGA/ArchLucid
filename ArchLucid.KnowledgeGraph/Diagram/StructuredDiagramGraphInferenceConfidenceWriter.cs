using System.Globalization;

namespace ArchLucid.KnowledgeGraph.Diagram;

internal static class StructuredDiagramGraphInferenceConfidenceWriter
{
    internal static void Write(IDictionary<string, string> properties, double confidence)
    {
        RemoveAliasKeys(properties);
        properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence] =
            confidence.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private static void RemoveAliasKeys(IDictionary<string, string> properties)
    {
        List<string> keysToRemove = new();
        foreach (string key in properties.Keys)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            if (string.Equals(
                    key.Trim(),
                    StructuredDiagramGraphPropertyKeys.InferenceConfidence,
                    StringComparison.OrdinalIgnoreCase))
            {
                keysToRemove.Add(key);
            }
        }

        foreach (string key in keysToRemove)
        {
            properties.Remove(key);
        }
    }
}
