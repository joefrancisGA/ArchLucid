using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Normalizes Microsoft OpenAPI JSON for stable <see cref="JsonNode.DeepEquals(JsonNode?, JsonNode?)" /> across
///     OS/runtime differences: <c>JsonObject</c> property order, <c>tags</c> array order (reflection-driven controller
///     discovery differs between Linux and Windows), and <c>required</c> arrays on schemas (reflection order for
///     [Required]/required members can differ cross-platform despite identical sets).
/// </summary>
internal static class OpenApiJsonCanonicalizer
{
    internal static JsonNode Canonicalize(JsonNode? node)
    {
        return node is null ? throw new ArgumentNullException(nameof(node)) : CanonicalizeCore(node, null);
    }

    private static JsonNode CanonicalizeCore(JsonNode node, string? parentPropertyName)
    {
        return node switch
        {
            JsonObject obj => CanonicalizeObject(obj),
            JsonArray arr => CanonicalizeArray(arr, parentPropertyName),
            _ => node.DeepClone()
        };
    }

    private static JsonObject CanonicalizeObject(JsonObject obj)
    {
        JsonObject result = new();

        foreach (KeyValuePair<string, JsonNode?> pair in obj.OrderBy(static p => p.Key, StringComparer.Ordinal))
        {
            if (pair.Value is null)
                result[pair.Key] = null;
            else
                result[pair.Key] = CanonicalizeCore(pair.Value, pair.Key);
        }

        return result;
    }

    private static JsonArray CanonicalizeArray(JsonArray arr, string? parentPropertyName)
    {
        List<JsonNode?> items = arr.Select(static item =>
            item is null ? null : CanonicalizeCore(item, null)).ToList();

        if (items.Count > 0)
        {
            if (string.Equals(parentPropertyName, "tags", StringComparison.Ordinal))
                SortTagsArray(items);
            else if (string.Equals(parentPropertyName, "required", StringComparison.Ordinal)
                     && RequiredArrayIsSortableStringOnly(items))
                SortStringArrayAscendingByStringValue(items);
        }

        JsonArray result = [];

        foreach (JsonNode? item in items)
            result.Add(item);

        return result;
    }

    // OpenAPI schema "required" is a set of property names (strings); order is insignificant.
    private static bool RequiredArrayIsSortableStringOnly(List<JsonNode?> items)
    {
        return items.TrueForAll(static i =>
            i is JsonValue v && v.GetValueKind() == JsonValueKind.String);
    }

    private static void SortStringArrayAscendingByStringValue(List<JsonNode?> items)
    {
        items.Sort(static (a, b) =>
            string.Compare(
                a!.GetValue<string>(),
                b!.GetValue<string>(),
                StringComparison.Ordinal));
    }

    private static void SortTagsArray(List<JsonNode?> items)
    {
        if (items.TrueForAll(static i => i is JsonValue v && v.GetValueKind() == JsonValueKind.String))
        {
            items.Sort(static (a, b) =>
                string.Compare(
                    a!.GetValue<string>(),
                    b!.GetValue<string>(),
                    StringComparison.Ordinal));
            return;
        }

        if (items.TrueForAll(static i =>
                i is JsonObject o
                && o.TryGetPropertyValue("name", out JsonNode? n)
                && n is JsonValue nv
                && nv.GetValueKind() == JsonValueKind.String
                && !o.ContainsKey("in")))
        {
            items.Sort(static (a, b) =>
            {
                string sa = a!["name"]!.GetValue<string>();
                string sb = b!["name"]!.GetValue<string>();

                return string.Compare(sa, sb, StringComparison.Ordinal);
            });
        }
    }

    internal static string SerializeIndented(JsonNode node)
    {
        return JsonSerializer.Serialize(
            node,
            new JsonSerializerOptions { WriteIndented = true });
    }
}
