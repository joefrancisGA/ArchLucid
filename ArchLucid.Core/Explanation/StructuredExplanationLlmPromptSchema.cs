using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Core.Explanation;

/// <summary>
///     Builds LLM prompt instructions for <see cref="StructuredExplanation" /> JSON from the type shape and
///     <see cref="JsonSerializerOptions" /> naming (camelCase keys).
/// </summary>
public static class StructuredExplanationLlmPromptSchema
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly IReadOnlyDictionary<string, string> OptionalFieldHints =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [nameof(StructuredExplanation.EvidenceRefs)] = "provenance or decision IDs you cite",
            [nameof(StructuredExplanation.Confidence)] = "between 0 and 1, or omit if unknown",
            [nameof(StructuredExplanation.Caveats)] = "limitations"
        };

    /// <summary>
    ///     Run-explanation user-prompt tail: schema bullets, example JSON, and plain-prose fallback instruction.
    /// </summary>
    /// <param name="reasoningContentHint">
    ///     Extra guidance appended to the required <c>reasoning</c> field (e.g. paragraph count).
    /// </param>
    public static string BuildRunExplanationJsonResponseInstructions(string reasoningContentHint)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reasoningContentHint);

        StringBuilder sb = new();
        sb.AppendLine("Respond with a single JSON object only (no markdown fences), matching this schema (camelCase keys):");

        foreach (PropertyInfo property in typeof(StructuredExplanation).GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            string? extraHint = property.Name == nameof(StructuredExplanation.Reasoning)
                ? reasoningContentHint
                : null;

            sb.AppendLine(FormatPropertyLine(property, extraHint));
        }

        sb.Append("Example: ");
        sb.AppendLine(BuildExampleJson());
        sb.Append("If you cannot follow the schema, respond with plain prose only (no JSON); the system will still accept it.");

        return sb.ToString();
    }

    internal static string FormatPropertyLine(PropertyInfo property, string? extraHint)
    {
        string jsonName = ResolveJsonPropertyName(property);
        string jsonType = MapToJsonTypeLabel(property.PropertyType);
        bool isRequired = property.GetCustomAttribute<RequiredMemberAttribute>() is not null;

        StringBuilder line = new();
        line.Append("- ");
        line.Append(jsonName);
        line.Append(": ");
        line.Append(jsonType);

        if (property.Name == nameof(StructuredExplanation.SchemaVersion))
            line.Append(" (use 1)");
        else if (isRequired)
        {
            line.Append(" (required)");

            if (!string.IsNullOrWhiteSpace(extraHint))
            {
                line.Append(" — ");
                line.Append(extraHint.Trim());
            }
        }
        else
        {
            line.Append(" — optional");

            if (OptionalFieldHints.TryGetValue(property.Name, out string? hint) && !string.IsNullOrWhiteSpace(hint))
            {
                line.Append(' ');
                line.Append(hint);
            }
        }

        return line.ToString();
    }

    internal static string BuildExampleJson()
    {
        StructuredExplanation sample = new()
        {
            SchemaVersion = 1,
            Reasoning = "...",
            EvidenceRefs = ["dec-1"],
            Confidence = 0.72m
        };

        return JsonSerializer.Serialize(sample, SerializerOptions);
    }

    private static string ResolveJsonPropertyName(PropertyInfo property)
    {
        JsonPropertyNameAttribute? nameAttr = property.GetCustomAttribute<JsonPropertyNameAttribute>();

        if (nameAttr is not null && !string.IsNullOrWhiteSpace(nameAttr.Name))
            return nameAttr.Name;

        return JsonNamingPolicy.CamelCase.ConvertName(property.Name);
    }

    private static string MapToJsonTypeLabel(Type propertyType)
    {
        Type type = Nullable.GetUnderlyingType(propertyType) ?? propertyType;

        if (type == typeof(int) || type == typeof(long) || type == typeof(decimal) || type == typeof(double) || type == typeof(float))
            return "number";

        if (type == typeof(string))
            return "string";

        if (type == typeof(bool))
            return "boolean";

        if (IsStringCollection(type))
            return "string[]";

        return "object";
    }

    private static bool IsStringCollection(Type type)
    {
        if (!type.IsGenericType)
            return false;

        Type genericDefinition = type.GetGenericTypeDefinition();

        if (genericDefinition != typeof(IReadOnlyList<>) && genericDefinition != typeof(IEnumerable<>)
            && genericDefinition != typeof(List<>))
            return false;

        Type[] args = type.GetGenericArguments();

        return args.Length == 1 && args[0] == typeof(string);
    }
}
