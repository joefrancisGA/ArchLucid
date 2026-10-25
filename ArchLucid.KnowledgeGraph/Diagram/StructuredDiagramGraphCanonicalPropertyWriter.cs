namespace ArchLucid.KnowledgeGraph.Diagram;

internal static class StructuredDiagramGraphCanonicalPropertyWriter
{
    internal static void WriteString(IDictionary<string, string> properties, string canonicalKey, string value)
    {
        RemoveAliasKeys(properties, canonicalKey);
        properties[canonicalKey] = value;
    }

    private static void RemoveAliasKeys(IDictionary<string, string> properties, string canonicalKey)
    {
        List<string> keysToRemove = new();
        foreach (string key in properties.Keys)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            if (string.Equals(key.Trim(), canonicalKey, StringComparison.OrdinalIgnoreCase))
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
