using System.Text.Json;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>Shared JSON element readers for graph node/edge converters.</summary>
internal static class GraphJsonElementReaders
{
    public static Dictionary<string, string> ReadProperties(JsonElement root)
        => GraphJsonPropertyBagReaders.ReadProperties(root);

    public static string? ReadFirstString(JsonElement root, params string[] names)
        => GraphJsonScalarReaders.ReadFirstString(root, names);

    public static double? ReadFirstDouble(JsonElement root, params string[] names)
        => GraphJsonScalarReaders.ReadFirstDouble(root, names);

    public static bool TryGetIgnoreCase(JsonElement obj, string name, out JsonElement value)
        => GraphJsonScalarReaders.TryGetIgnoreCase(obj, name, out value);
}
