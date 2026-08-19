using System.Text.Json.Nodes;

using ArchLucid.TestSupport.GoldenCorpus;

namespace ArchLucid.ContextIngestion.Tests.GoldenCorpus;

/// <summary>Stable JSON for golden comparisons (property order, sorted nested dictionaries).</summary>
internal static class IngestionGoldenOutputNormalizer
{
    public static string Normalize(string json)
    {
        JsonNode? root = JsonNode.Parse(json);
        Assert.NotNull(root);
        if (root is not JsonArray array)
            return root.ToJsonString(GoldenCorpusJson.SerializerOptions);
        JsonArray sorted = [];
        foreach (JsonNode? item in array)
        {
            if (item is not JsonObject obj)
                continue;

            sorted.Add(SortObjectAndProps(obj));
        }

        return sorted.ToJsonString(GoldenCorpusJson.SerializerOptions);

    }

    private static JsonObject SortObjectAndProps(JsonObject o)
    {
        JsonObject copy = new();
        foreach (KeyValuePair<string, JsonNode?> kv in o.OrderBy(static x => x.Key, StringComparer.Ordinal))
        {
            if (kv is { Key: "properties", Value: JsonObject p })
            {
                JsonObject sortedProps = new();
                foreach (KeyValuePair<string, JsonNode?> pkv in p.OrderBy(static x => x.Key, StringComparer.Ordinal))
                {
                    sortedProps[pkv.Key] = DeepCopy(pkv.Value);
                }

                copy[kv.Key] = sortedProps;
            }
            else

                copy[kv.Key] = DeepCopy(kv.Value);
        }

        return copy;
    }

    private static JsonNode? DeepCopy(JsonNode? node)
    {
        return node is null ? null : JsonNode.Parse(node.ToJsonString())!;
    }
}
