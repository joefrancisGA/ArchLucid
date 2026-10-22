using System.Text.Json;
using System.Text.Json.Serialization;

using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace ArchLucid.Cli.Stack;

/// <summary>Reads <c>archlucid.stack.yaml</c> or <c>.json</c> into <see cref="ArchlucidStackDocument" />.</summary>
internal static class ArchlucidStackDocumentParser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    internal static ArchlucidStackDocument ParseFile(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        if (!File.Exists(path))
            throw new FileNotFoundException($"Stack answers file not found: {path}", path);

        string raw = File.ReadAllText(path);
        string extension = Path.GetExtension(path);

        if (extension.Equals(".yaml", StringComparison.OrdinalIgnoreCase)
            || extension.Equals(".yml", StringComparison.OrdinalIgnoreCase))
            return ParseYaml(raw);

        return ParseJson(raw);
    }

    internal static ArchlucidStackDocument ParseJson(string raw)
    {
        ArchlucidStackDocument? document = JsonSerializer.Deserialize<ArchlucidStackDocument>(raw, JsonOptions);

        if (document is null)
            throw new InvalidOperationException("Stack answers JSON deserialized to null.");

        return document;
    }

    internal static ArchlucidStackDocument ParseYaml(string raw)
    {
        IDeserializer deserializer = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .IgnoreUnmatchedProperties()
            .Build();

        ArchlucidStackDocument? document = deserializer.Deserialize<ArchlucidStackDocument>(raw);

        if (document is null)
            throw new InvalidOperationException("Stack answers YAML deserialized to null.");

        return document;
    }
}
