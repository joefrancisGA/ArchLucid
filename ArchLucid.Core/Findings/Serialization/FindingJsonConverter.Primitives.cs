using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Findings;
using ArchLucid.Core.Json;

namespace ArchLucid.Core.Findings.Serialization;

public sealed partial class FindingJsonConverter
{
    /// <summary>
    ///     Deserializes the <c>trace</c> property from <paramref name="root" />.
    ///     When deserialization fails the corrupt JSON is noted in <paramref name="finding" />
    ///     <c>Properties["_traceDeserializationWarning"]</c> so downstream consumers
    ///     can detect data loss without silently discarding the error.
    /// </summary>
    private static ExplainabilityTrace ReadTrace(JsonElement root, JsonSerializerOptions options, Finding finding)
    {
        if (!TryGetPropertyCaseInsensitive(root, "trace", out JsonElement tr))
            return new ExplainabilityTrace();
        try
        {
            return JsonSerializer.Deserialize<ExplainabilityTrace>(tr.GetRawText(), options) ??
                   new ExplainabilityTrace();
        }
        catch (JsonException ex)
        {
            finding.Properties["_traceDeserializationWarning"] =
                $"Trace JSON could not be deserialized and was replaced with an empty trace. Error: {ex.Message}";
            return new ExplainabilityTrace();
        }
    }

    private static string? ReadOptionalString(JsonElement root, string name) =>
        FindingJsonStringReaders.ReadOptionalString(root, name);

    private static string ReadRequiredString(JsonElement root, string name) =>
        FindingJsonStringReaders.ReadRequiredString(root, name);

    private static void WriteOptionalString(Utf8JsonWriter writer, string name, string? value) =>
        FindingJsonStringReaders.WriteOptionalString(writer, name, value);

    private static List<string> ReadStringList(JsonElement root, string name) =>
        FindingJsonStringReaders.ReadStringList(root, name);

    private static Dictionary<string, string> ReadStringDict(JsonElement root, string name) =>
        FindingJsonStringReaders.ReadStringDict(root, name);

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value) =>
        FindingJsonStringReaders.TryGetPropertyCaseInsensitive(element, propertyName, out value);

    private static string ReadStringDictValue(JsonElement element) =>
        FindingJsonStringReaders.ReadStringDictValue(element);

    private static bool TryReadWholeNumberInt32(JsonElement element, out int value) =>
        FindingJsonNumericReaders.TryReadWholeNumberInt32(element, out value);

    private static bool TryReadFiniteDouble(JsonElement element, out double value) =>
        FindingJsonNumericReaders.TryReadFiniteDouble(element, out value);

    private static bool TryReadInt32(JsonElement element, out int value) =>
        FindingJsonNumericReaders.TryReadInt32(element, out value);

    private static bool TryParseWholeNumberString(string? raw, out int value) =>
        FindingJsonNumericReaders.TryParseWholeNumberString(raw, out value);

    private static bool TryCoerceStringTokenToRawText(string raw, out string? value) =>
        FindingJsonStringReaders.TryCoerceStringTokenToRawText(raw, out value);

    private static bool TryParseWholeNumberLongString(string? raw, out long value) =>
        FindingJsonNumericReaders.TryParseWholeNumberLongString(raw, out value);

    private static bool TryReadDecimal(JsonElement element, out decimal value) =>
        FindingJsonNumericReaders.TryReadDecimal(element, out value);

    private static bool TryParseBooleanString(string? raw, out bool value) =>
        JsonBooleanStringReader.TryParseBooleanString(raw, out value);

    private static bool TryReadReviewedAtUtc(JsonElement element, out DateTimeOffset value) =>
        FindingJsonDateReaders.TryReadReviewedAtUtc(element, out value);
}
