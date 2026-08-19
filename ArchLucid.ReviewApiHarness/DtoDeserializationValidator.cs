using System.Collections;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.ReviewApiHarness;

/// <summary>
///     Deserializes JSON into a generated Api.Client DTO and fails when NSwag
///     <c>AdditionalProperties</c> captures undeclared members (contract drift).
/// </summary>
public sealed class DtoDeserializationValidator
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    public ResponseValidationResult Validate(Type dtoType, JsonElement payload)
    {
        if (dtoType is null)
            throw new ArgumentNullException(nameof(dtoType));

        object? dto;

        try
        {
            dto = JsonSerializer.Deserialize(payload.GetRawText(), dtoType, JsonOptions);
        }
        catch (JsonException ex)
        {
            return ResponseValidationResult.Fail($"DTO deserialize ({dtoType.Name}) failed: {ex.Message}");
        }

        if (dto is null)
            return ResponseValidationResult.Fail($"DTO deserialize ({dtoType.Name}) returned null.");

        List<string> errors = [];
        CollectAdditionalProperties(dto, dtoType, "$", errors, new HashSet<object>(ReferenceEqualityComparer.Instance));
        return new ResponseValidationResult(errors.Count == 0, errors);
    }

    public ResponseValidationResult Validate<T>(JsonElement payload) => Validate(typeof(T), payload);

    private static void CollectAdditionalProperties(
        object instance,
        Type type,
        string path,
        List<string> errors,
        HashSet<object> visited)
    {
        if (!visited.Add(instance))
            return;

        PropertyInfo? additional = type.GetProperty(
            "AdditionalProperties",
            BindingFlags.Instance | BindingFlags.Public);

        if (additional?.GetValue(instance) is IDictionary dictionary && dictionary.Count > 0)
        {
            foreach (object? key in dictionary.Keys)
                errors.Add($"Undeclared DTO property '{key}' at {path} ({type.Name}.AdditionalProperties).");
        }

        foreach (PropertyInfo property in type.GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {
            if (string.Equals(property.Name, "AdditionalProperties", StringComparison.Ordinal))
                continue;

            if (property.GetIndexParameters().Length > 0)
                continue;

            if (property.GetCustomAttribute<JsonIgnoreAttribute>() is not null)
                continue;

            object? value;

            try
            {
                value = property.GetValue(instance);
            }
            catch
            {
                continue;
            }

            if (value is null)
                continue;

            string jsonName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name ?? property.Name;
            string childPath = path + "." + jsonName;

            if (value is string or ValueType)
                continue;

            if (value is IDictionary map)
            {
                foreach (DictionaryEntry entry in map)
                {
                    if (entry.Value is null || entry.Value is string or ValueType)
                        continue;

                    CollectAdditionalProperties(
                        entry.Value,
                        entry.Value.GetType(),
                        $"{childPath}[{entry.Key}]",
                        errors,
                        visited);
                }

                continue;
            }

            if (value is IEnumerable enumerable and not IDictionary)
            {
                int index = 0;

                foreach (object? item in enumerable)
                {
                    if (item is null || item is string or ValueType)
                    {
                        index++;
                        continue;
                    }

                    CollectAdditionalProperties(
                        item,
                        item.GetType(),
                        $"{childPath}[{index}]",
                        errors,
                        visited);
                    index++;
                }

                continue;
            }

            CollectAdditionalProperties(value, value.GetType(), childPath, errors, visited);
        }
    }
}
