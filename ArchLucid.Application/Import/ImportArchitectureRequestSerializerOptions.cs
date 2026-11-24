using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Application.Import;

/// <summary>Strict JSON options for imported architecture request files (camelCase, no unknown members).</summary>
public static class ImportArchitectureRequestSerializerOptions
{
    public static JsonSerializerOptions StrictDeserialize
    {
        get;
    } = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReadCommentHandling = JsonCommentHandling.Disallow,
        AllowTrailingCommas = false,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        Converters = { new ValidatedEnumJsonConverterFactory(new JsonStringEnumConverter()) }
    };
}
