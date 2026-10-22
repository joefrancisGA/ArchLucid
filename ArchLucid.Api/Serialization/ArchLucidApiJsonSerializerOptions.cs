using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Api.Serialization;

/// <summary>
///     JSON options aligned with <c>AddArchLucidMvc().AddJsonOptions</c> for byte-stable serialization (ETags,
///     tests). Chains source-generated contexts before reflection fallback (TB-2162).
/// </summary>
internal static class ArchLucidApiJsonSerializerOptions
{
    public static readonly JsonSerializerOptions Web = Create();

    internal static void Configure(JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        options.PropertyNameCaseInsensitive = true;

        if (!options.Converters.Any(static converter => converter is JsonStringEnumConverter))
        {
            // k6 and CLI payloads often send numeric enum values (cloudProvider: 1); allow integers alongside strings.
            options.Converters.Add(new JsonStringEnumConverter(null, allowIntegerValues: true));
        }

        ArchLucidApiJsonTypeInfoResolverChain.Apply(options);
    }

    private static JsonSerializerOptions Create()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);
        Configure(options);

        return options;
    }
}
